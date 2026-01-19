import { useState, useEffect, useRef } from 'preact/hooks'
import { loadFromStorage, saveToStorage } from '../../utils/storage'
import { postWords } from '../../utils/api'
import { AddWordModal } from '../../modals/AddWord/AddWord'
import { ExportModal } from '../../modals/Export/Export'
import './style.css'
import { useRoute } from 'preact-iso'
import { Trash2 } from 'lucide-preact'
import { useLocation } from 'preact-iso'



type WordItem = {
  word: string
  definition: string
  synonyms: string[]
}

function isTruncated(el: HTMLElement) {
  return el.scrollWidth > el.clientWidth
}

const initialWords: WordItem[] = []


export function Glossaire() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWord, setEditingWord] = useState<WordItem | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const { params } = useRoute()

  const location = useLocation()

  const tooltipRef = useRef<HTMLDivElement>(null)

  const glossaryName = params.name || 'Unknown Glossary'
  const STORAGE_KEY = `glossary_${glossaryName}`

  const [tooltip, setTooltip] = useState<{
    text: string
    x: number
    y: number
  } | null>(null)

  const [words, setWords] = useState<WordItem[]>(() =>
    loadFromStorage(STORAGE_KEY, initialWords)
  )

  const [glossaryDescription, setGlossaryDescription] = useState<
    string | undefined
  >()

  useEffect(() => {
    const glossaries = loadFromStorage('glossaries', []) as Array<{
      name: string
      description: string
    }>
    const currentGlossary = glossaries.find((g) => g.name === glossaryName)
    if (currentGlossary) {
      setGlossaryDescription(currentGlossary.description)
    }
  }, [glossaryName])

  useEffect(() => {
    saveToStorage(STORAGE_KEY, words)
  }, [words, STORAGE_KEY])

  useEffect(() => {
    if (tooltip && tooltipRef.current) {
      tooltipRef.current.style.left = `${tooltip.x}px`
      tooltipRef.current.style.top = `${tooltip.y}px`
    }
  }, [tooltip])

  const handleAddWord = (
    word: string,
    definition: string,
    synonyms: string[]
  ) => {
    const entry: WordItem = { word, definition, synonyms }

    if (editingWord) {
      setWords((prev) =>
        prev.map((w) => (w.word === editingWord.word ? entry : w))
      )
      setEditingWord(null)
    } else {
      setWords((prev) => [...prev, entry])
    }

    setIsModalOpen(false)
  }

  const handleDeleteWord = (wordToDelete: string) => {
    if (confirm(`Supprimer le mot "${wordToDelete}" ?`)) {
      setWords((prev) => prev.filter((w) => w.word !== wordToDelete))
    }
  }

  const [, setExportError] = useState<string | null>(null)

  const handleExport = async () => {
    setExportError(null)
    try {
      const endpoint = '/api/words'
      await postWords(endpoint, words)
      setIsExportModalOpen(true)
    } catch (err) {
      console.error('Export failed', err)
      if (err instanceof Error) {
        setExportError(err.message)
      } else {
        setExportError(String(err))
      }
      setIsExportModalOpen(true)
    }
  }

  return (
    <div className="glossaire">
      <div className="glossaire-header">
        <nav className="deco">
          <img src="/deco.svg" title="Decoration" alt="Decoration" />
          <h1>{glossaryName}</h1>
        </nav>

        <div className="header-buttons">
          <button className="export-btn" onClick={handleExport}>
            <img src="/export.svg" alt="Export icon" />
            {'Export'}
          </button>
          <button className="new-word" onClick={() => setIsModalOpen(true)}>
            Add New Word
          </button>
        </div>
      </div>

      <table className="glossaire-table">
        <thead>
          <tr>
            <th>Word</th>
            <th>Definition</th>
            <th>Synonyms</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {words.map((w) => (
            <tr key={w.word}>
              <td className="GlossaryWord" data-fulltext={w.word}>
                <span
                  className="text-limit"
                  data-fulltext={w.word}
                  onMouseEnter={(e) => {
                    const el = e.target as HTMLElement
                    if (!isTruncated(el)) return

                    const rect = el.getBoundingClientRect()
                    setTooltip({
                      text: w.word,
                      x: rect.left,
                      y: rect.bottom + 6,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {w.word}
                </span>
              </td>

              <td className="GlossaryDefinition">
                <span
                  className="text-limit"
                  data-fulltext={w.definition}
                  onMouseEnter={(e) => {
                    const el = e.target as HTMLElement
                    if (!isTruncated(el)) return

                    const rect = el.getBoundingClientRect()
                    setTooltip({
                      text: w.definition,
                      x: rect.left,
                      y: rect.bottom + 6,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {w.definition}
                </span>
              </td>

              <td className="GlossarySynonyms">
                {w.synonyms.length > 0 ? (
                  w.synonyms.map((syn) => (
                    <span className="tag" key={syn}>
                      {syn}
                    </span>
                  ))
                ) : (
                  <span className="no-synonyms">No synonyms</span>
                )}
              </td>

              <td className="action-cell">
                <div className="action-buttons">
                  <button
                    className="edit-btn"
                    onClick={() => {
                      setEditingWord(w)
                      setIsModalOpen(true)
                    }}
                    title="Modifier"
                  >
                    <img src="/modifier.svg" alt="Modifier" />
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteWord(w.word)}
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="Parser"
        onClick={() => {
          location.route('/parser')
        }}
      >
        Parser
      </button>



      <AddWordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingWord(null)
        }}
        onAddWord={handleAddWord}
        initialData={editingWord}
        isEdit={!!editingWord}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        glossary={{
          name: glossaryName,
          description: glossaryDescription,
          words: words,
        }}
      />

      {tooltip && (
        <div className="tooltip-popup" ref={tooltipRef}>
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
