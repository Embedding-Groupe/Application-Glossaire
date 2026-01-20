# Guide d'Utilisation des Services

Ce guide explique comment utiliser les services refactorisés dans les composants.

## Injection de Dépendances via le Conteneur

### Initialisation

```typescript
import { DependencyContainer } from '../infrastructure/DependencyContainer'

// Récupérer l'instance singleton
const container = DependencyContainer.getInstance()

// Récupérer les services
const glossaryService = container.getGlossaryService()
const wordService = container.createWordService('MonGlossaire')
```

## Services Disponibles

### GlossaryService

Service pour gérer les glossaires.

```typescript
// Créer un glossaire
const glossary = glossaryService.createGlossary(
  'Python',
  'Termes liés à Python'
)

// Récupérer tous les glossaires
const all = glossaryService.getAllGlossaries()

// Récupérer un glossaire spécifique
const glossary = glossaryService.getGlossary('Python')

// Mettre à jour un glossaire
glossaryService.updateGlossary(
  'Python',
  'Python',
  'Mise à jour de la description'
)

// Supprimer un glossaire
glossaryService.deleteGlossary('Python')

// Rechercher des glossaires
const results = glossaryService.searchGlossaries('python')
```

### WordService

Service pour gérer les mots dans un glossaire.

```typescript
const wordService = container.createWordService('MonGlossaire')

// Ajouter un mot
const word = wordService.addWord('fonction', 'Un bloc de code réutilisable', [
  'procédure',
  'méthode',
])

// Charger tous les mots
const words = wordService.loadWords()

// Obtenir un mot spécifique
const word = wordService.getWord('fonction')

// Mettre à jour un mot
wordService.updateWord('fonction', 'fonction', 'Nouvelle définition', [
  'nouvelles',
  'synonymes',
])

// Supprimer un mot
wordService.deleteWord('fonction')

// Rechercher des mots
const results = wordService.searchWords('fonc')

// Vérifier si un mot existe
const exists = wordService.wordExists('fonction')
```

## Exemples dans les Composants

### Utilisation dans un Composant Preact

```typescript
import { useState, useEffect } from 'preact/hooks'
import { DependencyContainer } from '../infrastructure/DependencyContainer'

export function MonComposant() {
  const [glossaries, setGlossaries] = useState([])
  const container = DependencyContainer.getInstance()
  const glossaryService = container.getGlossaryService()

  useEffect(() => {
    // Charger les glossaires au montage
    const data = glossaryService.getAllGlossaries()
    setGlossaries(data)
  }, [])

  const handleAddGlossary = (name: string, description: string) => {
    const newGlossary = glossaryService.createGlossary(name, description)
    setGlossaries([...glossaries, newGlossary])
  }

  const handleDeleteGlossary = (name: string) => {
    glossaryService.deleteGlossary(name)
    setGlossaries(glossaries.filter((g) => g.name !== name))
  }

  return (
    <div>
      {/* Rendu des glossaires */}
    </div>
  )
}
```

### Utilisation avec des Événements

```typescript
const handleAddWord = (
  word: string,
  definition: string,
  synonyms: string[]
) => {
  const wordService = container.createWordService(glossaryName)

  try {
    const newWord = wordService.addWord(word, definition, synonyms)
    console.log('Mot ajouté:', newWord)
    // Mise à jour de l'UI
  } catch (error) {
    console.error('Erreur:', error)
  }
}
```

## Avantages par rapport à l'Ancienne Approche

### Avant (Direct localStorage/fetch)

```typescript
const words = JSON.parse(localStorage.getItem('glossary_key') || '[]')
// Couplage fort au localStorage
// Difficile à tester
// Logique éparpillée dans les composants
```

### Après (Services)

```typescript
const wordService = container.createWordService('MonGlossaire')
const words = wordService.loadWords()
// Couplage faible aux abstractions
// Facile à tester avec des mocks
// Logique centralisée et réutilisable
```

## Testabilité Améliorée

Les services peuvent être facilement testés :

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { GlossaryService } from '../services/GlossaryService'
import { GlossaryRepository } from '../repositories/GlossaryRepository'

// Mock du storage
class MockStorage implements IStorageProvider {
  private data = {}
  load<T>(key: string, fallback: T): T {
    return (key in this.data ? this.data[key] : fallback) as T
  }
  save<T>(key: string, data: T): void {
    this.data[key] = data
  }
  remove(key: string): void {
    delete this.data[key]
  }
  clear(): void {
    this.data = {}
  }
}

describe('GlossaryService', () => {
  it('devrait créer un glossaire', () => {
    const repository = new GlossaryRepository()
    const storage = new MockStorage()
    const service = new GlossaryService(repository, storage)

    const glossary = service.createGlossary('Test', 'Description')
    expect(glossary.name).toBe('Test')
  })
})
```

## Migration des Composants Existants

### Composant Avant

```typescript
import { loadFromStorage, saveToStorage } from '../../utils/storage'

export function Glossaire() {
  const [glossaries, setGlossaries] = useState(() =>
    loadFromStorage('glossaries', [])
  )

  useEffect(() => {
    saveToStorage('glossaries', glossaries)
  }, [glossaries])
}
```

### Composant Après

```typescript
import { DependencyContainer } from '../../infrastructure/DependencyContainer'

export function Glossaire() {
  const [glossaries, setGlossaries] = useState(() => {
    const container = DependencyContainer.getInstance()
    return container.getGlossaryService().getAllGlossaries()
  })

  // Le service s'occupe de la persistance automatiquement
}
```

## Points Clés à Retenir

1. ✅ **Toujours utiliser le conteneur** pour accéder aux services
2. ✅ **Utiliser les interfaces** pour les types, pas les implémentations
3. ✅ **Les services gèrent la persistance** automatiquement
4. ✅ **Tester avec des mocks** des interfaces
5. ✅ **La migration est progressive** - l'ancien code continue de fonctionner
