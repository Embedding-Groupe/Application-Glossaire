import { useState } from 'preact/hooks'
import type { ParserResult } from '../../utils/importExport'
import {
  downloadParserResultsAsJSON,
  downloadParserResultsAsMarkdown,
  exportParserResultsToJSON,
  exportParserResultsToMarkdown,
} from '../../utils/importExport'
import './Export.css'

interface ParsedTerm {
  term: string
  occurrence: number
}

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  terms: ParsedTerm[]
  glossaryWords: string[]
}

export function ExportModal({
  isOpen,
  onClose,
  fileName,
  terms,
  glossaryWords,
}: ExportModalProps) {
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [exportingFormat, setExportingFormat] = useState<
    'JSON' | 'Markdown' | null
  >(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewFormat, setPreviewFormat] = useState<
    'JSON' | 'Markdown' | null
  >(null)

  if (!isOpen) return null

  const parserResult: ParserResult = {
    fileName,
    terms: terms.map((t) => ({
      term: t.term,
      occurrence: t.occurrence,
      inGlossary: glossaryWords.includes(t.term.toLowerCase()),
    })),
  }

  const handleExport = async (
    exporter: (result: ParserResult) => Promise<void>,
    format: 'JSON' | 'Markdown'
  ) => {
    setExportingFormat(format)
    setError('')
    try {
      await exporter(parserResult)
      setSuccess(`Résultats exportés en ${format} avec succès !`)
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 2000)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors de l'export"
      // Don't show error message if operation was cancelled
      if (errorMessage !== 'Opération annulée') {
        setError(errorMessage)
      }
    } finally {
      setExportingFormat(null)
    }
  }

  const handleExportJSON = () =>
    handleExport(downloadParserResultsAsJSON, 'JSON')
  const handleExportMarkdown = () =>
    handleExport(downloadParserResultsAsMarkdown, 'Markdown')

  const handlePreview = (content: string, format: 'JSON' | 'Markdown') => {
    setPreviewContent(content)
    setPreviewFormat(format)
  }

  const handlePreviewJSON = () =>
    handlePreview(exportParserResultsToJSON(parserResult), 'JSON')
  const handlePreviewMarkdown = () =>
    handlePreview(exportParserResultsToMarkdown(parserResult), 'Markdown')

  const handleClosePreview = () => {
    setPreviewContent(null)
    setPreviewFormat(null)
  }

  const exportActions = [
    { handler: handleExportJSON, label: 'Export as JSON', type: 'export' },
    {
      handler: handleExportMarkdown,
      label: 'Export as Markdown',
      type: 'export',
    },
  ]

  const previewActions = [
    { handler: handlePreviewJSON, label: 'JSON File Preview', type: 'preview' },
    {
      handler: handlePreviewMarkdown,
      label: 'Markdown File Preview',
      type: 'preview',
    },
  ]

  return (
    <button
      type="button"
      className="export-modal-overlay"
      aria-label="Close dialog"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        className="export-modal-content export-modal"
        role="dialog"
        aria-modal="true"
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
                  Export your analysis containing{' '}
                  <strong>{terms.length}</strong> term(s) with{' '}
                  <strong>
                    {
                      terms.filter((t) =>
                        glossaryWords.includes(t.term.toLowerCase())
                      ).length
                    }
                  </strong>{' '}
                  in glossary and{' '}
                  <strong>
                    {
                      terms.filter(
                        (t) => !glossaryWords.includes(t.term.toLowerCase())
                      ).length
                    }
                  </strong>{' '}
                  not in glossary.
                </p>

                <div className="export-options">
                  {exportActions.map(({ handler, label }) => (
                    <button
                      key={label}
                      className="btn btn-primary"
                      onClick={handler}
                      disabled={exportingFormat !== null}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="preview-options">
                  {previewActions.map(({ handler, label }) => (
                    <button
                      key={label}
                      className="btn btn-secondary"
                      onClick={handler}
                      disabled={exportingFormat !== null}
                    >
                      {label}
                    </button>
                  ))}
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
    </button>
  )
}
