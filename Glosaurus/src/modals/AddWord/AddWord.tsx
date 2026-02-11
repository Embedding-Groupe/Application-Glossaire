import { useEffect, useRef, useState, useCallback } from 'preact/hooks'
import './AddWord.css'
import { postJSON } from '../../utils/api'

interface AddWordModalProps {
  isOpen: boolean
  onClose: () => void
  onAddWord: (
    word: string,
    definition: string,
    synonyms: string[],
    boundedContext?: string
  ) => void
  initialData?: {
    word: string
    definition: string
    synonyms: string[]
    boundedContext?: string
  } | null
  isEdit?: boolean
  glossaryName?: string
  glossaryDescription?: string
}

interface SynonymResponse {
  synonyms: string[]
}

export function SynonymSuggestion({
  word,
  definition,
  userSynonyms,
  onAddSynonym,
  glossaryName,
  glossaryDescription,
  boundedContext,
}: {
  word: string
  definition: string
  userSynonyms: string[]
  onAddSynonym: (synonym: string) => void
  glossaryName?: string
  glossaryDescription?: string
  boundedContext?: string
}) {
  const [synonyms, setSynonyms] = useState<string[]>([])
  const [startIndex, setStartIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchSynonyms = useCallback(() => {
    if (
      !word ||
      word.trim() === '' ||
      !definition ||
      definition.trim() === ''
    ) {
      setSynonyms([])
      setStartIndex(0)
      return
    }

    setLoading(true)
    postJSON('http://127.0.0.1:8000/synonym/getSynonym', {
      word: word.trim(),
      definition: definition,
      synonyms: userSynonyms || [],
      glossary_name: glossaryName,
      glossary_description: glossaryDescription,
      bounded_context: boundedContext,
    })
      .then((data) => {
        const response = data as SynonymResponse
        if (
          response?.synonyms &&
          Array.isArray(response.synonyms) &&
          response.synonyms.length > 0
        ) {
          const uniqueSynonyms: string[] = Array.from(
            new Set(response.synonyms as string[])
          )
          setSynonyms(uniqueSynonyms)
          setStartIndex(0)
        } else {
          setSynonyms([])
        }
      })
      .catch((err) => {
        console.error('Erreur API :', err)
        setSynonyms([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [word, definition, userSynonyms])

  // Initial fetch when word or definition changes (debounced)
  useEffect(() => {
    if (!word?.trim() || !definition?.trim()) {
      setSynonyms([])
      setStartIndex(0)
      return
    }

    const timeout = setTimeout(() => {
      fetchSynonyms()
    }, 500)

    return () => clearTimeout(timeout)
  }, [word, definition])

  // Filter out synonyms already added by the user
  const availableSynonyms = synonyms.filter(
    (s) => !userSynonyms.map((us) => us.toLowerCase()).includes(s.toLowerCase())
  )

  // Determine current slice for display
  const visibleSynonyms = availableSynonyms.slice(startIndex, startIndex + 5)

  const handleDisplayNext = () => {
    if (availableSynonyms.length <= 5) return
    const nextIndex = (startIndex + 5) % availableSynonyms.length
    setStartIndex(nextIndex)
  }

  return (
    <div className="ai-suggestion">
      <p>
        AI Suggestions:{' '}
        {loading ? (
          'Loading...'
        ) : visibleSynonyms.length > 0 ? (
          <>
            {visibleSynonyms.map((syn, i) => (
              <button
                key={i}
                type="button"
                className="clickable-synonym"
                onClick={() => onAddSynonym(syn)}
                title="Cliquer pour ajouter ce synonyme"
              >
                {syn}
                {i < visibleSynonyms.length - 1 && ', '}
              </button>
            ))}
          </>
        ) : (
          'No suggestion found'
        )}
      </p>

      <div className="suggestion-actions">
        {!loading && availableSynonyms.length > 5 && (
          <button
            onClick={handleDisplayNext}
            className="action-link-btn"
            title="Show more synonyms"
          >
            More
          </button>
        )}

        <button
          onClick={fetchSynonyms}
          className="action-link-btn"
          disabled={loading}
          title="Refresh suggestions"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}

export default SynonymSuggestion

export function AddWordModal({
  isOpen,
  onClose,
  onAddWord,
  initialData,
  isEdit,
  glossaryName,
  glossaryDescription,
}: AddWordModalProps) {
  const [word, setWord] = useState(initialData?.word || '')
  const [definition, setDefinition] = useState(initialData?.definition || '')
  const [synonyms, setSynonyms] = useState<string[]>(
    initialData?.synonyms || []
  )
  const [boundedContext, setBoundedContext] = useState(
    initialData?.boundedContext || ''
  )

  const [currentSynonym, setCurrentSynonym] = useState('')
  const [errors, setErrors] = useState<{
    word?: string
    definition?: string
    synonyms?: string
    doublons?: string
    doublonsWord?: string
  }>({})

  const modalRef = useRef<HTMLDivElement | null>(null)
  const firstInputRef = useRef<HTMLInputElement | null>(null)
  const previouslyFocused = useRef<Element | null>(null)

  const wordMaxLength = 30
  const definitionMaxLength = 200
  const synonymMaxLength = 30
  const boundedContextMaxLength = 30

  useEffect(() => {
    if (initialData) {
      setWord(initialData.word)
      setDefinition(initialData.definition)
      setSynonyms(initialData.synonyms)
      setBoundedContext(initialData.boundedContext || '')
    } else {
      setWord('')
      setDefinition('')
      setSynonyms([])
      setBoundedContext('')
    }
  }, [initialData, isOpen])

  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      setTimeout(() => {
        firstInputRef.current?.focus()
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
    }
  }, [isOpen, onClose])

  const handleRemoveSynonym = useCallback((index: number) => {
    setSynonyms((prev) => prev.filter((_, i) => i !== index))
  }, [])

  useEffect(() => {
    const lowerWord = word.trim().toLowerCase()

    const index = synonyms.findIndex(
      (syn) => syn.trim().toLowerCase() === lowerWord
    )

    if (index !== -1) {
      handleRemoveSynonym(index)

      setErrors((prev) => ({
        ...prev,
        doublonsWord: "You can't add a synonym that is the same as the word",
      }))
    } else {
      setErrors((prev) => ({
        ...prev,
        doublons: undefined,
      }))
    }
  }, [word, synonyms, handleRemoveSynonym])

  const CheckSynonymNotEqualToWord = (syn: string, index?: number): boolean => {
    const lowerWord = word.trim().toLowerCase()
    const lowerSyn = syn.trim().toLowerCase()

    if (lowerSyn === lowerWord) {
      setErrors((prev) => ({
        ...prev,
        definition: prev.definition,
        word: prev.word,
        synonyms: "The synonym can't be the same as the word",
      }))
      if (index !== undefined) {
        handleRemoveSynonym(index)
      }
      return false
    }

    setErrors((prev) => ({ ...prev, synonyms: undefined }))
    return true
  }

  const handleAddSynonym = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && currentSynonym.trim() !== '') {
      e.preventDefault()

      const syn = currentSynonym.trim().toLowerCase()

      if (!CheckSynonymNotEqualToWord(syn)) {
        return
      }

      if (synonyms.some((s) => s.toLowerCase() === syn)) {
        setErrors((prev) => ({
          ...prev,
          doublons: 'This synonym has already been added',
        }))
        setCurrentSynonym('')
        return
      }

      setTimeout(() => {
        setErrors((prev) => ({ ...prev, doublons: undefined }))
      }, 5000)

      setSynonyms([...synonyms, syn])
      setCurrentSynonym('')
    }
  }

  const handleSubmit = () => {
    const newErrors: { word?: string; definition?: string } = {}

    if (!word.trim()) newErrors.word = 'Please provide a word !'
    if (!definition.trim())
      newErrors.definition = 'Please provide a description of the word !'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      let final_word: string = word.toLowerCase()

      onAddWord(final_word, definition, synonyms, boundedContext)
      setWord('')
      setDefinition('')
      setSynonyms([])
      setBoundedContext('')
      setErrors({})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" ref={modalRef}>
        <h2>{isEdit ? 'Update Word' : 'Add a New Word'}</h2>

        <label className={'word-label'} htmlFor="word-input">
          <span>Word</span>
          <span className="required">*</span>
        </label>
        <div className="input-container">
          <input
            id="word-input"
            ref={firstInputRef}
            type="text"
            className={`word-area ${errors.word ? 'input-error' : ''}`}
            placeholder="Enter the word"
            value={word}
            maxLength={wordMaxLength}
            onInput={(e) => {
              const val = (e.target as HTMLInputElement).value
              if (val.includes(' ')) {
                setErrors((prev) => ({
                  ...prev,
                  word: 'Only one word is allowed',
                }))
                return
              }
              setWord(val)
              setErrors((prev) => ({ ...prev, word: undefined }))
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const dt = e.dataTransfer
              if (!dt) return
              const droppedSyn = dt.getData('text/plain')
              if (droppedSyn) {
                setWord(droppedSyn)
                const index = synonyms.findIndex((s) => s === droppedSyn)
                if (index !== -1) handleRemoveSynonym(index)
              }
            }}
          />
          <div className="char-counter">
            {word.length}/{wordMaxLength}
          </div>
        </div>

        <nav className="attention">
          {errors.word && (
            <>
              <img src="/attention.svg" alt="attention" />
              <p className="error-text">{errors.word}</p>
            </>
          )}
        </nav>

        <label className="definition-label" htmlFor="definition-input">
          <span>Definition</span>
          <span className="required">*</span>
        </label>
        <div className="input-container">
          <textarea
            id="definition-input"
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

        <nav className="attention">
          {errors.definition && (
            <>
              <img src="/attention.svg" alt="attention" />
              <p className="error-text">{errors.definition}</p>
            </>
          )}
        </nav>

        <label className="context-label" htmlFor="context-input">
          Bounded Context (Optional)
        </label>
        <div className="input-container">
          <input
            id="context-input"
            type="text"
            className="word-area"
            placeholder="Enter bounded context"
            value={boundedContext}
            maxLength={boundedContextMaxLength}
            onInput={(e) =>
              setBoundedContext((e.target as HTMLInputElement).value)
            }
          />
          <div className="char-counter">
            {boundedContext.length}/{boundedContextMaxLength}
          </div>
        </div>

        <label className={'synonym-label'} htmlFor="synonym-input">
          Synonyms (Optional)
        </label>
        <div className="input-container">
          <input
            id="synonym-input"
            type="text"
            placeholder="Press enter to add a synonym"
            value={currentSynonym}
            maxLength={synonymMaxLength}
            onInput={(e) => {
              const value = (e.target as HTMLInputElement).value.toLowerCase()
              setCurrentSynonym(value)
            }}
            onKeyDown={handleAddSynonym}
            onFocus={() => {
              setErrors((prev) => ({
                ...prev,
                doublonsWord: undefined,
                synonyms: undefined,
              }))
            }}
          />
          <div className="char-counter">
            {currentSynonym.length}/{synonymMaxLength}
          </div>
        </div>

        {errors.synonyms && (
          <nav className="attention">
            <img src="/attention.svg" alt="attention" />
            <p className="error-text">{errors.synonyms}</p>
          </nav>
        )}
        {errors.doublons && (
          <nav className="attention">
            <img src="/attention.svg" alt="attention" />
            <p className="error-text">{errors.doublons}</p>
          </nav>
        )}
        {errors.doublonsWord && (
          <nav className="attention">
            <img src="/attention.svg" alt="attention" />
            <p className="error-text">{errors.doublonsWord}</p>
          </nav>
        )}

        <div className="synonym-list">
          {synonyms.map((syn, i) => (
            <span
              key={i}
              className="tag"
              draggable={true}
              onDragStart={(e) => {
                const dt = e.dataTransfer
                if (!dt) return
                dt.setData('text/plain', syn)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setWord(syn)
                  const index = synonyms.findIndex((s) => s === syn)
                  if (index !== -1) handleRemoveSynonym(index)
                }
              }}
            >
              <button
                className="remove-btn"
                onClick={() => handleRemoveSynonym(i)}
                aria-label="remove synonym"
              >
                ×
              </button>
              {syn}
            </span>
          ))}
        </div>

        <nav>
          <img
            src="/ia.png"
            className="logo-ia"
            title="AI Suggestions"
            alt=""
          />
          <SynonymSuggestion
            word={word}
            definition={definition}
            userSynonyms={synonyms}
            glossaryName={glossaryName}
            glossaryDescription={glossaryDescription}
            boundedContext={boundedContext}
            onAddSynonym={(syn: string) => {
              if (!synonyms.includes(syn)) {
                setSynonyms([...synonyms, syn])
              }
            }}
          />
        </nav>
        <div className="modal-actions">
          <button className="cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="add" onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Add Word'}
          </button>
        </div>
      </div>
    </div>
  )
}
