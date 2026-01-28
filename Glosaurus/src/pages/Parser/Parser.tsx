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

interface WordItem {
  word: string
  definition: string
  synonyms: string[]
  boundedContext?: string
}

export function Parser() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()

  const previousGlossaryName =
    location.query?.glossary ?? 'Unknown Glossary'

  const [fileName] = useState<string>('example_source.py')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)


  const [terms] = useState<ParsedTerm[]>([
    { term: 'class', occurrence: 14 },
    { term: 'function', occurrence: 9 },
    { term: 'import', occurrence: 6 },
    { term: 'async', occurrence: 4 },
    { term: 'await', occurrence: 4 },
    { term: 'Parser', occurrence: 3 },
    { term: 'Glossary', occurrence: 2 },
    { term: 'FastAPI', occurrence: 5 },
  ])

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
    words: [],
  }

  return (
    <div className="parser">
      <div className="parser-header">
        <nav className="deco">
          <img src="/deco.svg" alt="Decoration" />
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
            className="back-btn"
            onClick={() =>
              location.route(
                `/glossaire/${encodeURIComponent(previousGlossaryName)}`
              )
            }
          >
            Back
          </button>
        </div>

        <input ref={fileInputRef} type="file" hidden />
      </div>

      <div className="terms-found">
        <h1>Technical terms found in {fileName} :</h1>

        <table className="parser-table">
          <thead>
            <tr>
              <th className="terms-column">Terms</th>
              <th className="occurrence-column">Occurrence</th>
            </tr>
          </thead>

          <tbody>
            {terms.map((t) => {
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

                  <td className="occurrence-column">
                    {t.occurrence}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="bottom-parser">
          <button
            className="download-btn"
            onClick={() => setIsExportModalOpen(true)}
          >
            Download Result
          </button>

          <div className="legend">
            <span className="legend-color"></span>
            <span className="legend-text">
              Words already present in the glossary
            </span>
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        glossary={glossary}
      />
    </div>
  )
}
