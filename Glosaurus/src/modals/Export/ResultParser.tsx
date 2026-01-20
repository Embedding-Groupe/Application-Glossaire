import { useState } from 'preact/hooks'
import type { Glossary } from '../../utils/importExport'
import {
  downloadGlossaryAsJSON,
  downloadGlossaryAsMarkdown,
  exportToJSON,
  exportToMarkdown,
} from '../../utils/importExport'
import './Export.css'

interface ParsedTerm {
  term: string
  occurrence: number
}

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  glossary: Glossary
  terms: ParsedTerm[]
}

export function ExportModal({
  isOpen,
  onClose,
  glossary,
  terms,
}: ExportModalProps) {
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewFormat, setPreviewFormat] = useState<
    'JSON' | 'Markdown' | null
  >(null)

  if (!isOpen) return null

  const glossaryWithTerms: Glossary = {
    ...glossary,
    words: terms.map((t) => ({
      word: t.term,
      definition: `Occurrence count: ${t.occurrence}`,
      synonyms: [],
    })),
  }

  const handleExport = async (
    exporter: (glossary: Glossary) => Promise<void>,
    format: string
  ) => {
    setIsExporting(true)
    setError('')
    setSuccess('')
    try {
      await exporter(glossaryWithTerms)
      setSuccess(`Glossaire exporté en ${format} avec succès !`)
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'export")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJSON = () => handleExport(downloadGlossaryAsJSON, 'JSON')
  const handleExportMarkdown = () =>
    handleExport(downloadGlossaryAsMarkdown, 'Markdown')

  const handlePreview = (content: string, format: 'JSON' | 'Markdown') => {
    setPreviewContent(content)
    setPreviewFormat(format)
  }

  const handlePreviewJSON = () =>
    handlePreview(exportToJSON(glossaryWithTerms), 'JSON')
  const handlePreviewMarkdown = () =>
    handlePreview(exportToMarkdown(glossaryWithTerms), 'Markdown')

  const handleClosePreview = () => {
    setPreviewContent(null)
    setPreviewFormat(null)
  }

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div
        className="export-modal-content export-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="export-modal-main">
          <h2>Export your Result</h2>

          <div className="export-modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {previewContent ? (
              <div className="preview-section">
                <h3>Preview as {previewFormat}</h3>
                <pre className="preview-content">
                  <code>{previewContent}</code>
                </pre>
                <button
                  className="btn btn-secondary"
                  onClick={handleClosePreview}
                >
                  Close Preview
                </button>
              </div>
            ) : (
              <>
                <p className="section-description">
                  Export your result containing
                  <strong> {terms.length}</strong> term(s).
                </p>

                <div className="export-options">
                  <button
                    className="btn btn-primary"
                    onClick={handleExportJSON}
                    disabled={isExporting}
                  >
                    {isExporting ? 'Exporting…' : 'Export as JSON'}
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={handleExportMarkdown}
                    disabled={isExporting}
                  >
                    {isExporting ? 'Exporting…' : 'Export as Markdown'}
                  </button>
                </div>

                <div className="preview-options">
                  <button
                    className="btn btn-secondary"
                    onClick={handlePreviewJSON}
                    disabled={isExporting}
                  >
                    JSON File Preview
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={handlePreviewMarkdown}
                    disabled={isExporting}
                  >
                    Markdown File Preview
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="export-modal-action">
          <button className="close-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
