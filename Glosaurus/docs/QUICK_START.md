# 🚀 Guide Rapide - Refactorisation SOLID

## En 5 Minutes

Glosaurus a été refactorisé pour respecter les principes SOLID. Voici ce que vous devez savoir :

### ✅ Avant

```typescript
// Couplé au localStorage, difficile à tester
const data = loadFromStorage('key', [])
localStorage.setItem('key', JSON.stringify(data))
```

### ✅ Après

```typescript
// Injecté, facile à tester, réutilisable
const wordService = container.createWordService('MonGlossaire')
const word = wordService.addWord('exemple', 'def', [])
```

## 📁 Fichiers Clés

| Fichier                     | But                            |
| --------------------------- | ------------------------------ |
| `src/application/services/` | **Logique métier**             |
| `src/infrastructure/`       | **Implémentations techniques** |
| `src/domain/repositories/`  | **Interfaces/contrats**        |
| `SERVICES_USAGE_GUIDE.md`   | **Comment utiliser**           |
| `ARCHITECTURE_SOLID.md`     | **Comprendre pourquoi**        |

## 🎯 Principes Clés

| Principe | Signification                             |
| -------- | ----------------------------------------- |
| **S**RP  | Chaque classe fait UNE chose              |
| **O**CP  | Extensible sans modification              |
| **L**SP  | Les implémentations sont interchangeables |
| **I**SP  | Interfaces petites et spécialisées        |
| **D**IP  | Dépendre des abstractions                 |

## 💻 Utilisation Rapide

### 1. Accéder au Conteneur

```typescript
import { DependencyContainer } from '../infrastructure/DependencyContainer'
const container = DependencyContainer.getInstance()
```

### 2. Utiliser les Services

```typescript
// Service glossaires
const glossaryService = container.getGlossaryService()
const glossary = glossaryService.createGlossary('Nom', 'Description')

// Service mots
const wordService = container.createWordService('MonGlossaire')
const word = wordService.addWord('mot', 'définition', ['synonymes'])
```

### 3. Les Services gèrent la Persistance

```typescript
// C'est automatique! Pas besoin de localStorage.setItem()
wordService.addWord(word, def, synonyms)
// ✅ Sauvegardé automatiquement
```

## 🧪 Tests

Facile de tester avec des mocks :

```typescript
const mockStorage = new MockStorageProvider()
const service = new GlossaryService(new GlossaryRepository(), mockStorage)
expect(service.createGlossary('Test', 'Desc').name).toBe('Test')
```

## 🔄 Migration

**L'ancien code fonctionne toujours** grâce aux wrappers de compatibilité :

```typescript
import { loadFromStorage } from '../../utils/storage' // ✅ Fonctionne encore
```

Vous pouvez migrer progressivement, composant par composant.

## 📚 Documentation

- **5 min** → [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)
- **15 min** → [SERVICES_USAGE_GUIDE.md](./SERVICES_USAGE_GUIDE.md)
- **30 min** → [ARCHITECTURE_SOLID.md](./ARCHITECTURE_SOLID.md)
- **Exemple complet** → [REFACTORING_EXAMPLE.md](./REFACTORING_EXAMPLE.md)

## ✨ Bénéfices

| Avant                        | Après                                   |
| ---------------------------- | --------------------------------------- |
| 🔴 Difficile à tester        | 🟢 Facile à tester                      |
| 🔴 Logique dispersée         | 🟢 Logique centralisée                  |
| 🔴 Couplée au localStorage   | 🟢 Abstrait via interfaces              |
| 🔴 Difficile à étendre       | 🟢 Facile d'ajouter des implémentations |
| 🔴 Responsabilités mélangées | 🟢 Responsabilités claires              |

## 🚀 Pour Commencer

### Option 1 : Utiliser les Nouveaux Services

```typescript
const container = DependencyContainer.getInstance()
const glossaryService = container.getGlossaryService()
// C'est prêt à utiliser!
```

### Option 2 : Migrer Progressivement

```typescript
// Continuer avec le code existant
import { loadFromStorage } from '../../utils/storage'
// Les wrappers font fonctionner les nouveaux services en arrière-plan
```

## ❓ Questions Rapides

**Q: Dois-je changer mon code existant?**  
A: Non! Les wrappers de compatibilité gardent l'ancien code fonctionnel.

**Q: Comment je teste les services?**  
A: Avec des mocks des interfaces. Voir [SERVICES_USAGE_GUIDE.md](./SERVICES_USAGE_GUIDE.md).

**Q: Comment j'ajoute une nouvelle implémentation?**  
A: Implémentez l'interface et changez le conteneur. Voir [ARCHITECTURE_SOLID.md](./ARCHITECTURE_SOLID.md).

**Q: Où est la logique métier?**  
A: Dans `src/application/services/`.

**Q: Où est l'implémentation technique?**  
A: Dans `src/infrastructure/`.

## 🎓 Vocabulaire

- **Service** : Logique métier réutilisable
- **Repository** : Accès aux données
- **Interface** : Contrat (ce qui doit être implémenté)
- **Injection** : Passer les dépendances au constructeur
- **Conteneur** : Crée et fournit les instances

## 🔗 Ressources

- [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - Navigation complète
- [SERVICES_USAGE_GUIDE.md](./SERVICES_USAGE_GUIDE.md) - Guide d'utilisation
- [REFACTORING_EXAMPLE.md](./REFACTORING_EXAMPLE.md) - Exemple complet
- [ARCHITECTURE_SOLID.md](./ARCHITECTURE_SOLID.md) - Théorie complète

## ✅ Checklist de Démarrage

- [ ] Lire ce fichier (5 min)
- [ ] Consulter [SERVICES_USAGE_GUIDE.md](./SERVICES_USAGE_GUIDE.md)
- [ ] Exécuter les tests
- [ ] Essayer d'utiliser un service
- [ ] Lire [REFACTORING_EXAMPLE.md](./REFACTORING_EXAMPLE.md) pour plus

## 🎯 Prochaine Étape

Regardez [SERVICES_USAGE_GUIDE.md](./SERVICES_USAGE_GUIDE.md) pour voir comment utiliser les services dans vos composants.

---

**Besoin d'aide?**

- Voir [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) pour naviguer
- Consulter les tests pour des exemples
- Lire [ARCHITECTURE_SOLID.md](./ARCHITECTURE_SOLID.md) pour la théorie

**Créé** : 19 janvier 2026  
**Version** : 1.0
