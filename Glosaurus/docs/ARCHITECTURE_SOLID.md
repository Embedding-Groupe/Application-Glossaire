# Architecture SOLID - Guide de Refactorisation

## Vue d'ensemble

Ce guide décrit les améliorations apportées au projet **Glosaurus** pour respecter les principes SOLID et améliorer la qualité du code.

## Principes SOLID Appliqués

### 1. Single Responsibility Principle (SRP)

**Avant** : Les modules `api.ts` et `storage.ts` mélangaient la logique métier avec la logique d'infrastructure.

**Après** : Séparation claire des responsabilités :

- `ApiClient` : Responsable uniquement de la communication HTTP
- `LocalStorageProvider` : Responsable uniquement de la persistance
- `GlossaryService` : Responsable de la logique métier des glossaires
- `WordService` : Responsable de la logique métier des mots

### 2. Open/Closed Principle (OCP)

**Avant** : Les implémentations étaient directement dépendantes des implémentations concrètes.

**Après** : Utilisation d'interfaces pour permettre l'extension sans modification :

```typescript
export interface IGlossaryRepository { ... }
export interface IStorageProvider { ... }
export interface IApiClient { ... }
```

Cela permet de créer de nouvelles implémentations (ex: `IndexedDBProvider`, `FirebaseApiClient`) sans modifier le code existant.

### 3. Liskov Substitution Principle (LSP)

**Implémentation** : Toutes les classes qui implémentent une interface peuvent être substituées entre elles :

```typescript
const storage: IStorageProvider = new LocalStorageProvider()
// Peut être remplacé par:
const storage: IStorageProvider = new IndexedDBProvider()
```

### 4. Interface Segregation Principle (ISP)

**Avant** : Interfaces larges et génériques.

**Après** : Interfaces petites et spécifiques :

- `IGlossaryRepository` : uniquement pour les opérations de glossaires
- `IStorageProvider` : uniquement pour la persistance
- `IApiClient` : uniquement pour les requêtes API

### 5. Dependency Inversion Principle (DIP)

**Avant** : Les services dépendaient directement de `localStorage` et `fetch`.

**Après** : Injection de dépendances via le constructeur :

```typescript
export class GlossaryService {
  constructor(
    private repository: IGlossaryRepository,
    private storage: IStorageProvider
  ) {}
}
```

Avec un conteneur IoC centralisé :

```typescript
const container = DependencyContainer.getInstance()
const glossaryService = container.getGlossaryService()
```

## Nouvelle Structure du Projet

```
src/
├── domain/
│   ├── types/
│   │   └── index.ts           # Types principaux
│   ├── repositories/
│   │   ├── IGlossaryRepository.ts  # Interface
│   │   ├── IStorageProvider.ts     # Interface
│   │   ├── IApiClient.ts           # Interface
│   │   └── GlossaryRepository.ts   # Implémentation
│   └── glossary.logic.ts       # (Compatibilité rétroactive)
├── application/
│   └── services/
│       ├── GlossaryService.ts  # Service métier
│       ├── WordService.ts      # Service métier
│       ├── GlossaryService.test.ts
│       └── WordService.test.ts
├── infrastructure/
│   ├── DependencyContainer.ts  # IoC Container
│   ├── api/
│   │   └── ApiClient.ts        # Client HTTP
│   └── storage/
│       └── LocalStorageProvider.ts  # Persistance
├── utils/
│   ├── api.ts              # (Wrapper de compatibilité)
│   └── storage.ts          # (Wrapper de compatibilité)
└── pages/, components/, etc.  # Inchangé
```

## Avantages de cette Refactorisation

### 1. **Testabilité**

- ✅ Les services peuvent être testés en isolation
- ✅ Les mocks sont faciles à créer (interfaces)
- ✅ Pas de dépendances externes fortes

**Avant** :

```typescript
// Difficile à tester, dépendance directe de localStorage
const data = loadFromStorage('key', [])
```

**Après** :

```typescript
// Facile à tester avec un mock
const service = new GlossaryService(mockRepository, mockStorage)
```

### 2. **Maintenabilité**

- ✅ Chaque classe a une responsabilité unique
- ✅ Facile de comprendre et modifier
- ✅ Risque d'effet de bord réduit

### 3. **Extensibilité**

- ✅ Ajouter une nouvelle implémentation de stockage (IndexedDB, Firebase) sans modifier le code existant
- ✅ Changer le client API sans affecter la logique métier
- ✅ Ajouter de nouveaux services sans impact sur les existants

### 4. **Reutilisabilité**

- ✅ Les services peuvent être utilisés dans différents contextes
- ✅ Les interfaces permettent le partage de contrats
- ✅ Les mocks facilitent les tests d'intégration

### 5. **Performance**

- ✅ Injection de dépendances via un conteneur singleton
- ✅ Pas de création répétée d'instances
- ✅ Optimisation possible au niveau du conteneur

## Guide de Migration

### Pour les Composants Existants

Les wrappers de compatibilité dans `api.ts` et `storage.ts` permettent une migration progressive.

**Code existant** : Fonctionne toujours

```typescript
import { loadFromStorage, saveToStorage } from '../../utils/storage'
const data = loadFromStorage('key', [])
```

**Nouveau code** : Utiliser les services injectés

```typescript
import { DependencyContainer } from '../../infrastructure/DependencyContainer'
const container = DependencyContainer.getInstance()
const glossaryService = container.getGlossaryService()
```

### Migration Progressive

1. **Phase 1** : Créer les services (✅ Complété)
2. **Phase 2** : Mettre à jour les composants existants
3. **Phase 3** : Retirer les wrappers de compatibilité
4. **Phase 4** : Étendre avec de nouvelles implémentations

## Cas d'Usage : Ajouter une Nouvelle Implémentation

### Exemple : Ajouter un fournisseur IndexedDB

```typescript
// src/infrastructure/storage/IndexedDBProvider.ts
export class IndexedDBProvider implements IStorageProvider {
  async load<T>(key: string, fallback: T): Promise<T> {
    const db = await this.openDB()
    // Logique IndexedDB
  }

  async save<T>(key: string, data: T): Promise<void> {
    const db = await this.openDB()
    // Logique IndexedDB
  }

  // ...
}
```

Puis modifier uniquement le conteneur :

```typescript
// DependencyContainer.ts
this.storageProvider = new IndexedDBProvider()
// Au lieu de: new LocalStorageProvider()
```

**Aucun changement** n'est requis dans les services ou composants!

## Conclusions

Cette refactorisation transforme Glosaurus en une application bien structurée, maintenable et testable, tout en respectant les principes de qualité de code SOLID. La migration peut se faire progressivement grâce à la compatibilité rétroactive, minimisant les risques.
