import { useRef, useState, useMemo } from 'preact/hooks'
import './Parser.css'
import { ExportModal } from '../../modals/Export/Export'
import type { Glossary } from '../../utils/importExport'
import { useLocation } from 'preact-iso'
import { loadFromStorage } from '../../utils/storage'

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

export function Parser() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const previousGlossaryName = location.query?.glossary ?? 'Unknown Glossary'

  const [fileName, setFileName] = useState<string>('No File')
  const [terms, setTerms] = useState<ParsedTerm[]>([])
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [filter, setFilter] = useState<FilterType>(null)

  const handleFileChange = () => {
    const files = fileInputRef.current?.files
    if (!files || files.length === 0) return

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
      })
      .catch((err) => {
        console.error('Erreur parser :', err)
        setTerms([])
      })
  }

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
    // Si on clique sur le filtre déjà actif, on le désactive
    if (filter === filterType) {
      setFilter(null)
    } else {
      // Sinon, on active le nouveau filtre
      setFilter(filterType)
    }
  }

  const glossaryWords = useMemo(() => {
    const storageKey = `glossary_${previousGlossaryName}`
    const stored = loadFromStorage(storageKey, []) as WordItem[]

    return stored.map((w) => w.word.toLowerCase())
  }, [previousGlossaryName])

  const isAlreadyInGlossary = (term: string) =>
    glossaryWords.includes(term.toLowerCase())

  const glossary: Glossary = {
    name: fileName,
    description: 'Imported file analysis',
    words: terms.map((t) => ({
      word: t.term,
      definition: '',
      synonyms: [],
      boundedContext: undefined,
    })),
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
            onClick={() => fileInputRef.current?.click()}
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
      </div>

      <div className="terms-found">
        <h1>Technical terms found in {fileName} :</h1>

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
                  >
                    {t.term}
                  </td>

                  <td className="occurrence-column">{t.occurrence}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        glossary={glossary}
      />
    </div>
  )
}
