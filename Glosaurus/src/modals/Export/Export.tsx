import { useState } from 'preact/hooks'
import type { Glossary, ParserResult } from '../../utils/importExport'
import {
  downloadGlossaryAsJSON,
  downloadGlossaryAsMarkdown,
  exportToJSON,
  exportToMarkdown,
  downloadParserResultsAsJSON,
  downloadParserResultsAsMarkdown,
  exportParserResultsToJSON,
  exportParserResultsToMarkdown,
} from '../../utils/importExport'
import './Export.css'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  glossary?: Glossary
  parserResult?: ParserResult
}

export function ExportModal({
  isOpen,
  onClose,
  glossary,
  parserResult,
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

  const isParserMode = !!parserResult
  const dataTitle = isParserMode
    ? 'Export your Parser Results'
    : 'Export your Glossary'

  const handleExportJSON = async () => {
    setExportingFormat('JSON')
    setError('')
    setSuccess('')
    try {
      if (isParserMode && parserResult) {
        await downloadParserResultsAsJSON(parserResult)
        setSuccess('Résultats exportés en JSON avec succès !')
      } else if (glossary) {
        await downloadGlossaryAsJSON(glossary)
        setSuccess('Glossaire exporté en JSON avec succès !')
      }
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

  const handleExportMarkdown = async () => {
    setExportingFormat('Markdown')
    setError('')
    setSuccess('')
    try {
      if (isParserMode && parserResult) {
        await downloadParserResultsAsMarkdown(parserResult)
        setSuccess('Résultats exportés en Markdown avec succès !')
      } else if (glossary) {
        await downloadGlossaryAsMarkdown(glossary)
        setSuccess('Glossaire exporté en Markdown avec succès !')
      }
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

  const handlePreviewJSON = () => {
    if (isParserMode && parserResult) {
      setPreviewContent(exportParserResultsToJSON(parserResult))
    } else if (glossary) {
      setPreviewContent(exportToJSON(glossary))
    }
    setPreviewFormat('JSON')
  }

  const handlePreviewMarkdown = () => {
    if (isParserMode && parserResult) {
      setPreviewContent(exportParserResultsToMarkdown(parserResult))
    } else if (glossary) {
      setPreviewContent(exportToMarkdown(glossary))
    }
    setPreviewFormat('Markdown')
  }

  const handleClosePreview = () => {
    setPreviewContent(null)
    setPreviewFormat(null)
  }

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
          <h2>{dataTitle}</h2>

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
                {isParserMode && parserResult ? (
                  <p className="section-description">
                    Export your analysis containing{' '}
                    <strong>{parserResult.terms.length}</strong> term(s) with{' '}
                    <strong>
                      {parserResult.terms.filter((t) => t.inGlossary).length}
                    </strong>{' '}
                    in glossary and{' '}
                    <strong>
                      {parserResult.terms.filter((t) => !t.inGlossary).length}
                    </strong>{' '}
                    not in glossary.
                  </p>
                ) : glossary ? (
                  <p className="section-description">
                    Export your glossary &ldquo;<strong>{glossary.name}</strong>
                    &rdquo; containing <strong>
                      {glossary.words.length}
                    </strong>{' '}
                    word(s).
                  </p>
                ) : null}

                <div className="export-options">
                  <button
                    className="btn btn-primary"
                    onClick={handleExportJSON}
                    disabled={exportingFormat !== null}
                  >
                    Export as JSON
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={handleExportMarkdown}
                    disabled={exportingFormat !== null}
                  >
                    Export as Markdown
                  </button>
                </div>
                <div className="preview-options">
                  <button
                    className="btn btn-secondary"
                    onClick={handlePreviewJSON}
                    disabled={exportingFormat !== null}
                  >
                    JSON File Preview
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handlePreviewMarkdown}
                    disabled={exportingFormat !== null}
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
    </button>
  )
}
