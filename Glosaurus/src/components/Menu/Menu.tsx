import { useState, useRef, useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import './Menu.css'
import { AddGlossaryModal } from '../../modals/AddGlossary/AddGlossary'
import { importGlossaryFromFile } from '../../utils/importExport'
import { loadFromStorage, saveToStorage } from '../../utils/storage'
import { Trash2 } from 'lucide-preact'
import { UpdateGlossary } from '../../modals/UpdateGlossary/UpdateGlossary'

interface Glossary {
  name: string
  description: string
  lastModified: string
}

export function Menu() {
  const STORAGE_KEY = 'glossaries'
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [glossaries, setGlossaries] = useState<Glossary[]>(() =>
    loadFromStorage(STORAGE_KEY, [])
  )
  const [editingGlossary, setEditingGlossary] = useState<Glossary | null>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  const { route } = useLocation()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tooltip, setTooltip] = useState<{
    text: string
    x: number
    y: number
  } | null>(null)

  useEffect(() => {
    saveToStorage(STORAGE_KEY, glossaries)
  }, [glossaries])

  useEffect(() => {
    if (tooltip && tooltipRef.current) {
      tooltipRef.current.style.left = `${tooltip.x}px`
      tooltipRef.current.style.top = `${tooltip.y}px`
    }
  }, [tooltip])

  const handleAddGlossary = (glossary: {
    name: string
    description: string
  }) => {
    const newGlossary: Glossary = {
      ...glossary,
      lastModified: new Date().toLocaleString(),
    }
    setGlossaries([...glossaries, newGlossary])
    setIsModalOpen(false)
  }

  const handleFileImport = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    try {
      const importedGlossary = await importGlossaryFromFile(file)

      const storageKey = `glossary_${importedGlossary.name}`
      saveToStorage(storageKey, importedGlossary.words)

      const newGlossary: Glossary = {
        name: importedGlossary.name,
        description:
          importedGlossary.description ||
          `Import - ${importedGlossary.words.length} word(s)`,
        lastModified: new Date().toLocaleString(),
      }

      setGlossaries([...glossaries, newGlossary])
      window.alert(`Glossary "${importedGlossary.name}" imported successfully!`)
    } catch (error) {
      window.alert(
        `Error during import: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteGlossary = (index: number) => {
    if (confirm('Delete this glossary?')) {
      const glossaryToDelete = glossaries[index]
      localStorage.removeItem(`glossary_${glossaryToDelete.name}`)
      setGlossaries(glossaries.filter((_, i) => i !== index))
    }
  }

  const handleOpenGlossary = (name: string) => {
    setGlossaries(
      glossaries.map((g) =>
        g.name === name
          ? { ...g, lastModified: new Date().toLocaleString() }
          : g
      )
    )

    route(`/glossaire/${encodeURIComponent(name)}`)
  }

  const filteredGlossaries = glossaries.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  const getWordCount = (glossaryName: string): number => {
    const storageKey = `glossary_${glossaryName}`
    const words = loadFromStorage(storageKey, [])
    return Array.isArray(words) ? words.length : 0
  }

  return (
    <div className="glossaire-page">
      <div className="glossaire-header">
        <nav className="deco">
          <img src="/deco.svg" title="Decoration" alt="Decoration" />
          <h1>My Glossaries</h1>
        </nav>

        <div className="header-buttons">
          <button
            className="import-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <img src="/import.svg" alt="Import icon" /> Import
          </button>
          <button className="new-word" onClick={() => setIsModalOpen(true)}>
            Create New Glossary
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.md,.markdown"
        onChange={handleFileImport}
        className="hidden-file-input"
        aria-label="Import glossary file"
        title="Import glossary file"
      />

      <input
        type="text"
        className="search-bar"
        placeholder="Search Glossaries..."
        value={search}
        onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
      />

      <table className="glossaire-table">
        <thead>
          <tr>
            <th>Name</th>
            <th className="Countword"></th>
            <th className="Description">Description</th>
            <th>Last Modified</th>
            <th className="actions-column"></th>
          </tr>
        </thead>
        <tbody>
          {filteredGlossaries.map((g, index) => (
            <tr key={index}>
              <td className="Name">
                <button
                  type="button"
                  className="text-label"
                  onClick={() => handleOpenGlossary(g.name)}
                  onMouseEnter={(e) => {
                    const rect = (
                      e.target as HTMLElement
                    ).getBoundingClientRect()
                    setTooltip({
                      text: g.name,
                      x: rect.left,
                      y: rect.bottom + 4,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {g.name}
                </button>
              </td>
              <td>
                <span className="badge-count">
                  {getWordCount(g.name)} word(s)
                </span>
              </td>

              <td className="clickable">
                <button
                  type="button"
                  className="text-label"
                  onClick={() => handleOpenGlossary(g.name)}
                  onMouseEnter={(e) => {
                    const rect = (
                      e.target as HTMLElement
                    ).getBoundingClientRect()
                    setTooltip({
                      text: g.description,
                      x: rect.left,
                      y: rect.bottom + 4,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {g.description}
                </button>
              </td>

              <td>{g.lastModified || 'Never'}</td>
              <td className="actions-cell">
                <button
                  className="edit-btn"
                  onClick={() => {
                    setEditingGlossary(g)
                    setIsUpdateModalOpen(true)
                  }}
                  title="Modifier"
                >
                  <img src="/modifier.svg" alt="Modifier" />
                </button>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleDeleteGlossary(index)}
                  aria-label="Delete glossary"
                  title="Delete glossary"
                >
                  <Trash2 size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {tooltip && (
        <div className="tooltip-popup" ref={tooltipRef}>
          {tooltip.text}
        </div>
      )}

      {isUpdateModalOpen && editingGlossary && (
        <UpdateGlossary
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          initialData={{
            word: editingGlossary.name,
            definition: editingGlossary.description,
            synonyms: [],
          }}
          onAddWord={(newName, newDescription) => {
            const oldStorageKey = `glossary_${editingGlossary.name}`
            const newStorageKey = `glossary_${newName}`

            if (newName !== editingGlossary.name) {
              const existingWords = loadFromStorage(oldStorageKey, [])
              saveToStorage(newStorageKey, existingWords)
              localStorage.removeItem(oldStorageKey)
            }

            setGlossaries(
              glossaries.map((g) =>
                g.name === editingGlossary.name
                  ? {
                    ...g,
                    name: newName,
                    description: newDescription,
                    lastModified: new Date().toLocaleString(),
                  }
                  : g
              )
            )

            setIsUpdateModalOpen(false)
          }}
        />
      )}

      {isModalOpen && (
        <AddGlossaryModal
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddGlossary}
        />
      )}
    </div>
  )
}
