# Exemple de Refactorisation : Page Home/Glossaire

Ce document montre comment refactoriser la page `Home/Glossaire.tsx` pour utiliser les nouveaux services.

## État Actuel

La page charge et sauvegarde les mots directement :

```typescript
const [words, setWords] = useState<WordItem[]>(() =>
  loadFromStorage(STORAGE_KEY, initialWords)
)

useEffect(() => {
  saveToStorage(STORAGE_KEY, words)
}, [words, STORAGE_KEY])
```

## Code Refactorisé

```typescript
import { useState, useEffect, useRef } from 'preact/hooks'
import { DependencyContainer } from '../../infrastructure/DependencyContainer'
import { WordItem } from '../../domain/types/index'
import { AddWordModal } from '../../modals/AddWord/AddWord'
import { ExportModal } from '../../modals/Export/Export'
import './style.css'
import { useRoute } from 'preact-iso'
import { Trash2 } from 'lucide-preact'

const initialWords: WordItem[] = []

export function Glossaire() {
  // Récupérer les services
  const container = DependencyContainer.getInstance()
  const glossaryService = container.getGlossaryService()
  const { params } = useRoute()

  const glossaryName = params.name || 'Unknown Glossary'
  const wordService = container.createWordService(glossaryName)

  // États locaux
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWord, setEditingWord] = useState<WordItem | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [tooltip, setTooltip] = useState<{
    text: string
    x: number
    y: number
  } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Charger les mots depuis le service
  const [words, setWords] = useState<WordItem[]>(() =>
    wordService.loadWords()
  )

  // Charger la description du glossaire
  const [glossaryDescription, setGlossaryDescription] = useState<string | undefined>()

  useEffect(() => {
    const glossary = glossaryService.getGlossary(glossaryName)
    if (glossary) {
      setGlossaryDescription(glossary.description)
    }
  }, [glossaryName])

  // Positionnement du tooltip
  useEffect(() => {
    if (tooltip && tooltipRef.current) {
      tooltipRef.current.style.left = \`\${tooltip.x}px\`
      tooltipRef.current.style.top = \`\${tooltip.y}px\`
    }
  }, [tooltip])

  /**
   * Ajouter ou mettre à jour un mot
   */
  const handleAddWord = (
    word: string,
    definition: string,
    synonyms: string[]
  ) => {
    try {
      if (editingWord) {
        // Mettre à jour le mot existant
        wordService.updateWord(
          editingWord.word,
          word,
          definition,
          synonyms
        )
        setWords((prev) =>
          prev.map((w) =>
            w.word === editingWord.word
              ? { word, definition, synonyms }
              : w
          )
        )
      } else {
        // Ajouter un nouveau mot
        wordService.addWord(word, definition, synonyms)
        setWords((prev) => [...prev, { word, definition, synonyms }])
      }
      setEditingWord(null)
    } catch (error) {
      console.error('Erreur lors de l\'ajout/mise à jour du mot:', error)
    }
    setIsModalOpen(false)
  }

  /**
   * Supprimer un mot
   */
  const handleDeleteWord = (wordToDelete: string) => {
    if (confirm(\`Supprimer le mot "\${wordToDelete}" ?\`)) {
      try {
        wordService.deleteWord(wordToDelete)
        setWords((prev) => prev.filter((w) => w.word !== wordToDelete))
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  /**
   * Rechercher des mots
   */
  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setWords(wordService.loadWords())
    } else {
      setWords(wordService.searchWords(searchTerm))
    }
  }

  /**
   * Éditer un mot existant
   */
  const handleEditWord = (word: WordItem) => {
    setEditingWord(word)
    setIsModalOpen(true)
  }

  // Rendu du composant
  return (
    <div class="glossary-container">
      <h1>{glossaryName}</h1>
      {glossaryDescription && <p class="description">{glossaryDescription}</p>}

      <div class="controls">
        <button onClick={() => {
          setEditingWord(null)
          setIsModalOpen(true)
        }}>
          Ajouter un mot
        </button>
        <button onClick={() => setIsExportModalOpen(true)}>
          Exporter
        </button>
        <input
          type="text"
          placeholder="Rechercher..."
          onInput={(e) => handleSearch((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="words-list">
        {words.length === 0 ? (
          <p>Aucun mot trouvé</p>
        ) : (
          words.map((word) => (
            <div key={word.word} class="word-item">
              <h3>{word.word}</h3>
              <p>{word.definition}</p>
              {word.synonyms.length > 0 && (
                <p class="synonyms">Synonymes: {word.synonyms.join(', ')}</p>
              )}
              <div class="actions">
                <button onClick={() => handleEditWord(word)}>Éditer</button>
                <button onClick={() => handleDeleteWord(word.word)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <AddWordModal
          onClose={() => {
            setIsModalOpen(false)
            setEditingWord(null)
          }}
          onAdd={handleAddWord}
          initialWord={editingWord}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
          onClose={() => setIsExportModalOpen(false)}
          words={words}
          glossaryName={glossaryName}
        />
      )}

      {tooltip && (
        <div ref={tooltipRef} class="tooltip">
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
```

## Améliorations Apportées

### 1. **Injection de Dépendances**

- ✅ Les services sont injectés via le conteneur
- ✅ Facile à remplacer avec des mocks pour les tests
- ✅ Pas de couplage dur à localStorage

### 2. **Séparation des Responsabilités**

- ✅ Le composant gère uniquement l'UI
- ✅ Les services gèrent la persistance
- ✅ Les erreurs sont gérées proprement

### 3. **Testabilité**

- ✅ Le composant peut être testé avec des services mockés
- ✅ Les services ont leurs propres tests unitaires
- ✅ Moins de dépendances globales

### 4. **Maintenabilité**

- ✅ Code plus lisible et organisé
- ✅ Logique métier centralisée
- ✅ Facile à étendre (ex: ajouter de la validation)

## Fonctionnalités Maintenant Centralisées

### Dans GlossaryService

- ✅ Gestion des glossaires
- ✅ Persistance des glossaires
- ✅ Recherche de glossaires

### Dans WordService

- ✅ Gestion des mots
- ✅ Persistance des mots
- ✅ Recherche de mots
- ✅ Vérification d'existence

### Dans le Composant

- ✅ Gestion de l'UI
- ✅ États locaux
- ✅ Interaction utilisateur

## Prochaines Étapes

1. Tester le composant refactorisé
2. Appliquer le même pattern aux autres pages (Menu, Parser)
3. Retirer graduellement les wrappers de compatibilité dans `api.ts` et `storage.ts`
4. Ajouter de la validation dans les services
5. Étendre avec de nouvelles fonctionnalités (ex: IndexedDB pour les glossaires volumineux)
