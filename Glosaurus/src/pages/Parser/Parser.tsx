import { useRef, useState } from 'preact/hooks'
import './Parser.css'
import { ExportModal } from '../../modals/Export/Export'
import type { Glossary } from '../../utils/importExport'
import { useLocation } from 'preact-iso'

interface ParsedTerm {
  term: string
  occurrence: number
}

export function Parser() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const previousGlossaryName = location.query?.glossary ?? 'Unknown Glossary'

  const [fileName, setFileName] = useState<string>('No File')
  const [terms, setTerms] = useState<ParsedTerm[]>([])
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

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

  const glossary: Glossary = {
    name: fileName,
    description: 'Imported file analysis',
    words: [],
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

        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileChange}
        />
      </div>

      <div className="terms-found">
        <h1>Terms found in {fileName}:</h1>
        <table className="parser-table">
          <thead>
            <tr>
              <th className="terms-column">Terms</th>
              <th className="occurrence-column">Occurrence</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((t) => (
              <tr key={t.term}>
                <td className="terms-column">{t.term}</td>
                <td className="occurrence-column">{t.occurrence}</td>
              </tr>
            ))}
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
