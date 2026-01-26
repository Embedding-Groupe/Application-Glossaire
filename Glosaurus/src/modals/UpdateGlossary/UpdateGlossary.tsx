import { useEffect, useRef, useState } from 'preact/hooks'
import './UpdateGlossary.css'

interface UpdateGlossaryProps {
  isOpen: boolean
  onClose: () => void
  onAddWord: (word: string, definition: string, synonyms: string[]) => void
  initialData?: {
    word: string
    definition: string
    synonyms: string[]
  } | null
}

export function UpdateGlossary({
  isOpen,
  onClose,
  onAddWord,
  initialData,
}: UpdateGlossaryProps) {
  const [word, setWord] = useState(initialData?.word || '')
  const [definition, setDefinition] = useState(initialData?.definition || '')
  const [errors, setErrors] = useState<{ word?: string; definition?: string }>(
    {}
  )

  const modalRef = useRef<HTMLDivElement | null>(null)
  const firstInputRef = useRef<HTMLInputElement | null>(null)
  const previouslyFocused = useRef<Element | null>(null)

  const wordMaxLength = 30
  const definitionMaxLength = 200

  useEffect(() => {
    if (initialData) {
      setWord(initialData.word)
      setDefinition(initialData.definition)
    } else {
      setWord('')
      setDefinition('')
    }
  }, [initialData, isOpen])

  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      setTimeout(() => firstInputRef.current?.focus(), 0)

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', onKey)
      return () => {
        document.removeEventListener('keydown', onKey)
        document.body.style.overflow = prev
        ;(previouslyFocused.current as HTMLElement | null)?.focus?.()
      }
    }
  }, [isOpen, onClose])

  const handleSubmit = () => {
    const newErrors: { word?: string; definition?: string } = {}
    if (!word.trim()) newErrors.word = 'Please provide a word!'
    if (!definition.trim())
      newErrors.definition = 'Please provide a description of the word!'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onAddWord(word, definition, [])
      setWord('')
      setDefinition('')
      setErrors({})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" ref={modalRef}>
        <h2>Update Glossary</h2>

        <label className="word-label">Word</label>
        <div className="input-container">
          <input
            ref={firstInputRef}
            type="text"
            className={`word-area ${errors.word ? 'input-error' : ''}`}
            placeholder="Enter the word"
            value={word}
            maxLength={wordMaxLength}
            onInput={(e) => {
              const val = (e.target as HTMLInputElement).value
              setWord(val)
              if (errors.word && val.trim() !== '') {
                setErrors((prev) => ({ ...prev, word: undefined }))
              }
            }}
          />
          <div className="char-counter">
            {word.length}/{wordMaxLength}
          </div>
        </div>
        {errors.word && (
          <nav className="attention">
            <img src="/attention.svg" alt="attention" />
            <p className="error-text">{errors.word}</p>
          </nav>
        )}

        <label className="definition-label">Definition</label>
        <div className="input-container">
          <textarea
            className={`definition-area ${errors.definition ? 'input-error' : ''}`}
            placeholder="Enter the definition"
            value={definition}
            maxLength={definitionMaxLength}
            onInput={(e) => {
              const val = (e.target as HTMLTextAreaElement).value
              setDefinition(val)
              if (errors.definition && val.trim() !== '') {
                setErrors((prev) => ({ ...prev, definition: undefined }))
              }
            }}
          />
          <div className="char-counter">
            {definition.length}/{definitionMaxLength}
          </div>
        </div>
        {errors.definition && (
          <nav className="attention">
            <img src="/attention.svg" alt="attention" />
            <p className="error-text">{errors.definition}</p>
          </nav>
        )}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="submit-btn" onClick={handleSubmit}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
