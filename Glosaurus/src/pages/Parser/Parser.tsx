import { useRef, useState, useMemo, useEffect } from 'preact/hooks'
import './Parser.css'
import { ExportModal } from '../../modals/Export/Export'
import { ImportChoiceModal } from '../../modals/Import/ImportChoiceModal'
import { useLocation } from 'preact-iso'
import { loadFromStorage } from '../../utils/storage'
import { open } from '@tauri-apps/plugin-dialog'
import { AddWordModal } from '../../modals/AddWord/AddWord'


declare let CanvasJS: any

interface ParsedTerm {
  term: string
  occurrence: number
}

type SortColumn = 'term' | 'occurrence' | null
type SortOrder = 'asc' | 'desc'
type FilterType = null | 'included' | 'not-included'

interface WordItem {
  word: string
}

interface ApiTermDetails {
  total_occurrences: number;
  files: { name: string; count: number }[];
}


export function Parser() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const previousGlossaryName = location.query?.glossary ?? 'Unknown Glossary'

  const [fileName, setFileName] = useState<string>('No File')
  const [error, setError] = useState<string | null>(null)
  const [terms, setTerms] = useState<ParsedTerm[]>([])
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [filter, setFilter] = useState<FilterType>(null)
  const [wordDistribution, setWordDistribution] = useState<
    Record<string, Record<string, number>>
  >({})

  const [glossaryVersion, setGlossaryVersion] = useState(0)

  const [isAddWordOpen, setIsAddWordOpen] = useState(false)
  const [wordToAdd, setWordToAdd] = useState<string | null>(null)



  const handleFileChange = () => {
    const files = fileInputRef.current?.files
    if (!files || files.length === 0) return

    setError(null)
    const file = files[0]
    setFileName(file.name)

    const formData = new FormData()
    formData.append('file', file)

    fetch('http://127.0.0.1:8000/parser/parse', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data: Record<string, number>) => {
        console.log('Réponse brute API:', data)

        const parsedTerms: ParsedTerm[] = Object.entries(data).map(
          ([term, occurrence]) => ({ term, occurrence })
        )
        console.log('parsedTerms transformé:', parsedTerms)

        setTerms(parsedTerms)
        setIsImportModalOpen(false)
      })
      .catch((err) => {
        console.error('Erreur parser :', err)
        setTerms([])
      })
  }

  const handleFolderImport = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      })

      if (selected === null) {
        // User cancelled the selection
        return
      }

      // selected is the absolute path string
      console.log('Selected folder:', selected)

      setFileName(selected as string)
      setTerms([])
      setError(null)

      // Call backend
      const response = await fetch(
        'http://127.0.0.1:8000/parser/parse_directory',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path: selected }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Network response was not ok')
      }

      const data: Record<string, ApiTermDetails> = await response.json();
      console.log('API response:', data);

      const parsedTerms: ParsedTerm[] = []
      const distribution: Record<string, Record<string, number>> = {}

      for (const [term, details] of Object.entries(data)) {
        parsedTerms.push({
          term,
          occurrence: details.total_occurrences,
        });

        const filesObj: Record<string, number> = {};
        details.files.forEach(f => {
          filesObj[f.name] = f.count;
        });

        distribution[term] = filesObj;
      }

      setTerms(parsedTerms)
      setWordDistribution(distribution)
      setIsImportModalOpen(false)
    } catch (err) {
      console.error('Error importing folder:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setTerms([])
    }
  }

  const [selectedWord, setSelectedWord] = useState<string | null>(null)

  const getSortedTerms = (): ParsedTerm[] => {
    // Filtrage d'abord
    let filtered = terms
    if (filter === 'included') {
      filtered = terms.filter((t) => isAlreadyInGlossary(t.term))
    } else if (filter === 'not-included') {
      filtered = terms.filter((t) => !isAlreadyInGlossary(t.term))
    }

    // Tri ensuite
    if (!sortColumn) return filtered

    const sorted = [...filtered]

    if (sortColumn === 'term') {
      sorted.sort((a, b) => {
        const comparison = a.term.localeCompare(b.term)
        return sortOrder === 'asc' ? comparison : -comparison
      })
    } else if (sortColumn === 'occurrence') {
      sorted.sort((a, b) => {
        const comparison = a.occurrence - b.occurrence
        return sortOrder === 'asc' ? comparison : -comparison
      })
    }

    return sorted
  }

  const [canvasReady, setCanvasReady] = useState(false)

  useEffect(() => {
    console.log('Tentative chargement CanvasJS')

    if ((window as any).CanvasJS) {
      console.log('CanvasJS déjà chargé')
      setCanvasReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.canvasjs.com/canvasjs.min.js'
    script.onload = () => {
      console.log(' CanvasJS chargé depuis CDN')
      setCanvasReady(true)
    }

    document.body.appendChild(script)
  }, [])

  const handleColumnSort = (column: 'term' | 'occurrence') => {
    if (sortColumn === column) {
      // Si on clique sur la même colonne, on inverse l'ordre
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Si on clique sur une nouvelle colonne, on trie en ascendant
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  const handleFilterClick = (filterType: 'included' | 'not-included') => {
    if (filter === filterType) {
      setFilter(null)
    } else {
      setFilter(filterType)
    }
  }

  const glossaryWords = useMemo(() => {
    const storageKey = `glossary_${previousGlossaryName}`
    const stored = loadFromStorage(storageKey, []) as WordItem[]

    return stored.map((w) => w.word.toLowerCase())
  }, [previousGlossaryName, glossaryVersion])


  const isAlreadyInGlossary = (term: string) =>
    glossaryWords.includes(term.toLowerCase())

  const glossaryStats = useMemo(() => {
    const parsedInGlossary = terms.filter((t) =>
      glossaryWords.includes(t.term.toLowerCase())
    ).length

    const totalGlossary = glossaryWords.length

    const coverage =
      totalGlossary === 0 ? 0 : (parsedInGlossary / totalGlossary) * 100

    const totalParsedOccurrences = terms.reduce(
      (sum, t) => sum + t.occurrence,
      0
    )

    const alignedOccurrences = terms
      .filter((t) => glossaryWords.includes(t.term.toLowerCase()))
      .reduce((sum, t) => sum + t.occurrence, 0)

    const alignment =
      totalParsedOccurrences === 0
        ? 0
        : (alignedOccurrences / totalParsedOccurrences) * 100

    return {
      parsedInGlossary,
      totalGlossary,
      coverage,

      alignedOccurrences,
      totalParsedOccurrences,
      alignment,
    }
  }, [terms, glossaryWords])


  const pieDataPoints = useMemo(() => {
    if (!selectedWord) return []

    const distribution = wordDistribution[selectedWord] || {}

    return Object.entries(distribution).map(([file, count]) => ({
      y: count,
      label: file
    }))
  }, [selectedWord, wordDistribution])


  useEffect(() => {
    if (!canvasReady || !chartRef.current || pieDataPoints.length === 0) return

    const chart = new CanvasJS.Chart(chartRef.current, {
      theme: "light2",
      animationEnabled: true,
      exportEnabled: false,
      title: {
        text: `Distribution of occurences of "${selectedWord}"`
      },
      data: [
        {
          type: "pie",
          startAngle: 25,
          toolTipContent: "<b>{label}</b>: {y} occurrences",
          showInLegend: true,
          legendText: "{label}",
          indexLabelFontSize: 16,
          indexLabel: "{label} - {y} occurrences",
          dataPoints: pieDataPoints
        }
      ]
    })

    chart.render()
  }, [pieDataPoints, selectedWord, canvasReady])

  const addWordToGlossary = (term: string) => {
    const storageKey = `glossary_${previousGlossaryName}`
    const existing = loadFromStorage(storageKey, []) as WordItem[]

    if (existing.some(w => w.word.toLowerCase() === term.toLowerCase())) {
      return
    }

    const updated = [
      ...existing,
      {
        word: term,
        definition: '',
        synonyms: [],
        boundedContext: undefined,
      },
    ]

    localStorage.setItem(storageKey, JSON.stringify(updated))
    setGlossaryVersion(v => v + 1)
  }



  return (
    <div className="parser">
      <div className="parser-header">
        <nav className="deco">
          <img src="/deco.svg" alt="Decoration" title="Decoration" />
          <h1>Parser</h1>
        </nav>

        <div className="header-buttons-parser">
          <button
            className="import-btn-parser"
            onClick={() => setIsImportModalOpen(true)}
          >
            <img src="/import.svg" alt="Import icon" /> Import
          </button>

          <button
            className="download-btn"
            onClick={() => setIsExportModalOpen(true)}
          >
            <img src="/download.svg" alt="Download icon" /> Download Result
          </button>

          <button
            className="back-btn"
            onClick={() =>
              location.route(
                `/glossaire/${encodeURIComponent(previousGlossaryName)}`
              )
            }
          >
            <img src="/back.svg" alt="Back icon" />
            Back
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileChange}
        />

        <ImportChoiceModal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false)
            setError(null)
          }}
          // @ts-ignore
          error={error}
          onSelectOption={(option) => {
            if (option === 'file') {
              fileInputRef.current?.click()
            } else {
              handleFolderImport()
            }
          }}
        />
      </div>

      <div className="terms-found">
        <h1>Terms found in {fileName} :</h1>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'included' ? 'active' : ''}`}
            onClick={() => handleFilterClick('included')}
          >
            Included in the glossary
          </button>
          <button
            className={`filter-btn ${filter === 'not-included' ? 'active' : ''}`}
            onClick={() => handleFilterClick('not-included')}
          >
            Not included in the glossary
          </button>

          <div className="legend">
            <span className="legend-color"></span>
            <span className="legend-text">
              Words already present in the glossary
            </span>
          </div>
        </div>
        <div className="table-with-coverage">
          <table className="parser-table">
            <thead>
              <tr>
                <th className="terms-column">
                  <div className="column-header">
                    <span>Terms</span>
                    <button
                      className="sort-icon-button"
                      onClick={() => handleColumnSort('term')}
                      title={
                        sortColumn === 'term'
                          ? sortOrder === 'asc'
                            ? 'Sort Z-A'
                            : 'Sort A-Z'
                          : 'Sort A-Z'
                      }
                    >
                      <img src="/arrow-up-down.svg" alt="Sort" />
                    </button>
                  </div>
                </th>
                <th className="occurrence-column">
                  <div className="column-header">
                    <span>Occurrence</span>
                    <button
                      className="sort-icon-button"
                      onClick={() => handleColumnSort('occurrence')}
                      title={
                        sortColumn === 'occurrence'
                          ? sortOrder === 'asc'
                            ? 'Sort descending'
                            : 'Sort ascending'
                          : 'Sort ascending'
                      }
                    >
                      <img src="/arrow-up-down.svg" alt="Sort" />
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {getSortedTerms().map((t) => {
                const alreadyExists = isAlreadyInGlossary(t.term)

                return (
                  <tr key={t.term}>
                    <td
                      className={
                        alreadyExists
                          ? 'terms-column already-present'
                          : 'terms-column'
                      }
                      onClick={() => setSelectedWord(t.term)}
                      style={{
                        cursor:
                          Object.keys(wordDistribution).length > 0
                            ? 'pointer'
                            : 'default',
                      }}
                    >
                      <span className="term-text">{t.term}</span>

                      {!alreadyExists && (
                        <button
                          className="add-to-glossary-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            addWordToGlossary(t.term)
                          }}
                          title="Add to glossary"
                        >
                          <img src="/download.svg" alt="Download icon" />
                        </button>
                      )}
                    </td>

                    <td className="occurrence-column">{t.occurrence}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="graphe-UL">


            <div className="UL">
              <span className="coverage-UL">
                UL Coverage = {glossaryStats.parsedInGlossary}/
                {glossaryStats.totalGlossary} ({glossaryStats.coverage.toFixed(1)}
                %)
              </span>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${glossaryStats.coverage <= 25
                    ? 'red'
                    : glossaryStats.coverage <= 50
                      ? 'yellow'
                      : glossaryStats.coverage <= 75
                        ? 'green-light'
                        : 'green-dark'
                    }`}
                  style={{ width: `${glossaryStats.coverage}%` }}
                />
              </div>
              <span className="alignement-UL">
                UL Alignment = {glossaryStats.alignedOccurrences}/
                {glossaryStats.totalParsedOccurrences} (
                {glossaryStats.alignment.toFixed(1)}%)
              </span>

              <div className="progress-bar">
                <div
                  className={`progress-fill ${glossaryStats.alignment <= 25
                    ? 'red'
                    : glossaryStats.alignment <= 50
                      ? 'yellow'
                      : glossaryStats.alignment <= 75
                        ? 'green-light'
                        : 'green-dark'
                    }`}
                  style={{ width: `${glossaryStats.alignment}%` }}
                />
              </div>
            </div>
            {selectedWord && (
              <div
                ref={chartRef}
                className="graphe"

              />
            )}
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        parserResult={{
          fileName,
          terms: terms.map((t) => ({
            term: t.term,
            occurrence: t.occurrence,
            inGlossary: isAlreadyInGlossary(t.term),
          })),
        }}
      />
      <AddWordModal
        isOpen={isAddWordOpen}
        onClose={() => {
          setIsAddWordOpen(false)
          setWordToAdd(null)
        }}
        onAddWord={(word, definition, synonyms, boundedContext) => {
          const storageKey = `glossary_${previousGlossaryName}`
          const existing = loadFromStorage(storageKey, []) as any[]

          const updated = [
            ...existing,
            {
              word,
              definition,
              synonyms,
              boundedContext,
            },
          ]

          localStorage.setItem(storageKey, JSON.stringify(updated))
          setGlossaryVersion(v => v + 1)
        }}
        initialData={
          wordToAdd
            ? {
              word: wordToAdd,
              definition: '',
              synonyms: [],
            }
            : null
        }
        glossaryName={previousGlossaryName}
      />

    </div>
  )
}
