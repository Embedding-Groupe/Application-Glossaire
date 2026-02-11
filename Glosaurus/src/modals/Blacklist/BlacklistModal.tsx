import { useState, useEffect, useRef } from 'preact/hooks'
import { save, ask } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import './BlacklistModal.css'

interface BlacklistModalProps {
    glossaryName: string
    onClose: () => void
}

export function BlacklistModal({ glossaryName, onClose }: BlacklistModalProps) {
    const [blacklist, setBlacklist] = useState<string[]>([])
    const [inputValue, setInputValue] = useState('')
    const [error, setError] = useState<string | null>(null)

    const modalRef = useRef<HTMLDivElement | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const previouslyFocused = useRef<Element | null>(null)

    const storageKey = `blacklist_${glossaryName}`

    // Load blacklist from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                setBlacklist(Array.isArray(parsed) ? parsed : [])
            } catch {
                setBlacklist([])
            }
        }
    }, [storageKey])

    // Handle modal accessibility
    useEffect(() => {
        previouslyFocused.current = document.activeElement
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        setTimeout(() => {
            inputRef.current?.focus()
        }, 0)

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
                ; (previouslyFocused.current as HTMLElement | null)?.focus?.()
        }
    }, [onClose])

    const saveToStorage = (list: string[]) => {
        localStorage.setItem(storageKey, JSON.stringify(list))
    }

    const addWord = () => {
        const trimmed = inputValue.trim().toLowerCase()

        if (!trimmed) {
            setError('Please enter a word')
            return
        }

        if (blacklist.includes(trimmed)) {
            setError('This word is already in the blacklist')
            return
        }

        const updated = [...blacklist, trimmed]
        setBlacklist(updated)
        saveToStorage(updated)
        setInputValue('')
        setError(null)
    }

    const removeWord = (word: string) => {
        const updated = blacklist.filter((w) => w !== word)
        setBlacklist(updated)
        saveToStorage(updated)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addWord()
        }
    }


    const handleClear = async () => {
        if (blacklist.length === 0) return

        const confirmed = await ask(`Are you sure you want to clear all ${blacklist.length} words from the blacklist?`, {
            title: 'Clear Blacklist',
            kind: 'warning'
        })

        if (confirmed) {
            setBlacklist([])
            saveToStorage([])
        }
    }

    const handleExport = async () => {
        if (blacklist.length === 0) {
            setError('No words to export')
            return
        }

        try {
            // Open save dialog
            const filePath = await save({
                defaultPath: `blacklist_${glossaryName}_${new Date().toISOString().split('T')[0]}.csv`,
                filters: [{
                    name: 'CSV',
                    extensions: ['csv']
                }]
            })

            if (!filePath) return // User cancelled

            // Create CSV content (one word per line)
            const csvContent = blacklist.join('\n')

            // Write file using Tauri's fs API
            await writeTextFile(filePath, csvContent)

            setError(null)
        } catch (err) {
            console.error('Export error:', err)
            setError('Error exporting file')
        }
    }

    const handleImport = (e: Event) => {
        const input = e.target as HTMLInputElement
        const file = input.files?.[0]

        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string
                // Split by newlines and commas, trim, lowercase, and filter empty
                const words = text
                    .split(/[\n,]/)
                    .map(word => word.trim().toLowerCase())
                    .filter(word => word.length > 0)

                if (words.length === 0) {
                    setError('No valid words found in CSV file')
                    return
                }

                // Merge with existing blacklist, removing duplicates
                const merged = Array.from(new Set([...blacklist, ...words]))
                setBlacklist(merged)
                saveToStorage(merged)
                setError(null)
            } catch (err) {
                setError('Error reading CSV file')
            }
        }

        reader.onerror = () => {
            setError('Error reading file')
        }

        reader.readAsText(file)

        // Reset input so the same file can be imported again
        input.value = ''
    }

    return (
        <button
            type="button"
            className="modal-backdrop"
            onClick={onClose}
            aria-label="Close dialog"
        >
            <div
                className="modal-content blacklist-modal"
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="blacklist-title"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="blacklist-title">Blacklist for {glossaryName}</h2>
                <p className="blacklist-description">
                    Add words to exclude from parsing results. Words are case-insensitive.
                </p>

                <div className="blacklist-input-section">
                    <div className="input-with-button">
                        <input
                            ref={inputRef}
                            type="text"
                            className={`blacklist-input ${error ? 'input-error' : ''}`}
                            placeholder="Enter a word to blacklist..."
                            value={inputValue}
                            onInput={(e) => {
                                setInputValue((e.target as HTMLInputElement).value)
                                if (error) setError(null)
                            }}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            type="button"
                            className="add-word-btn"
                            onClick={addWord}
                            title="Add word"
                        >
                            <img src="/circle-plus.svg" alt="Add" />
                            Add
                        </button>
                    </div>
                    {error && (
                        <nav className="attention">
                            <img src="/attention.svg" alt="attention" />
                            <p className="error-text">{error}</p>
                        </nav>
                    )}
                </div>

                <div className="blacklist-tags-container">
                    {blacklist.length === 0 ? (
                        <p className="empty-state">No words in blacklist yet</p>
                    ) : (
                        <div className="tags-list">
                            {blacklist.map((word) => (
                                <div key={word} className="tag">
                                    <span className="tag-text">{word}</span>
                                    <button
                                        type="button"
                                        className="tag-remove"
                                        onClick={() => removeWord(word)}
                                        title="Remove word"
                                        aria-label={`Remove ${word}`}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="blacklist-actions">
                    <button
                        type="button"
                        className="clear-btn"
                        onClick={handleClear}
                        disabled={blacklist.length === 0}
                        title="Clear all words from blacklist"
                    >
                        <img src="/attention.svg" alt="Clear" />
                        Clear All
                    </button>
                    <button
                        type="button"
                        className="import-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Import blacklist from CSV"
                    >
                        <img src="/import.svg" alt="Import" />
                        Import CSV
                    </button>
                    <button
                        type="button"
                        className="export-btn"
                        onClick={handleExport}
                        disabled={blacklist.length === 0}
                        title="Export blacklist to CSV"
                    >
                        <img src="/export.svg" alt="Export" />
                        Export CSV
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    style={{ display: 'none' }}
                    onChange={handleImport}
                />

                <div className="modal-actions">
                    <button type="button" className="close-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </button>
    )
}
