# Plan d'Action - Prochaines Étapes

## 🎯 Objectif Global

Finaliser la refactorisation SOLID en migreant les composants existants et en testant l'application complète.

## 📋 Phase 1 : Validation (1-2 semaines)

### 1.1 Tests Automatisés ✅ COMPLÉTÉ

- [x] GlossaryService.test.ts créé
- [x] WordService.test.ts créé
- [ ] **À FAIRE** : Exécuter les tests
  ```bash
  npm run test
  ```

### 1.2 Vérifier la Compilation ⏳ À FAIRE

- [ ] Compiler TypeScript sans erreurs
  ```bash
  npm run build
  ```
- [ ] Vérifier les types des nouveaux services

### 1.3 Tester la Rétrocompatibilité ⏳ À FAIRE

- [ ] Vérifier que l'ancien code fonctionne
  ```typescript
  import { loadFromStorage } from '../../utils/storage'
  // Doit fonctionner sans changement
  ```
- [ ] Les wrappers doivent créer les services automatiquement

### 1.4 Test Manuel ⏳ À FAIRE

- [ ] Lancer l'app : `npm run dev`
- [ ] Charger la page d'accueil
- [ ] Ajouter un glossaire
- [ ] Ajouter un mot
- [ ] Vérifier la persistance (rechargement)
- [ ] Tester la suppression
- [ ] Tester la recherche

## 📋 Phase 2 : Migration Composants (2-4 semaines)

### 2.1 Refactoriser `Home/Glossaire.tsx` ⏳ À FAIRE

**Fichier** : `src/pages/Home/index.tsx`

**Tâches** :

- [ ] Remplacer les appels `loadFromStorage` par `wordService`
- [ ] Remplacer les appels `saveToStorage` par `wordService`
- [ ] Supprimer l'useEffect de sauvegarde (service s'en charge)
- [ ] Tester le composant

**Référence** : Voir [REFACTORING_EXAMPLE.md](./REFACTORING_EXAMPLE.md)

**Effort** : 2-3 heures

### 2.2 Refactoriser `Menu.tsx` ⏳ À FAIRE

**Fichier** : `src/components/Menu/Menu.tsx`

**Tâches** :

- [ ] Utiliser `glossaryService` pour charger les glossaires
- [ ] Supprimer les appels `loadFromStorage` directs
- [ ] Implémenter la création via service
- [ ] Implémenter la suppression via service
- [ ] Tester le composant

**Effort** : 2-3 heures

### 2.3 Refactoriser `Parser.tsx` ⏳ À FAIRE

**Fichier** : `src/pages/Parser/Parser.tsx`

**Tâches** :

- [ ] Vérifier si elle utilise le stockage
- [ ] Si oui, migrer vers les services
- [ ] Tester le parsing

**Effort** : 1-2 heures

### 2.4 Refactoriser les Modals ⏳ À FAIRE

**Fichiers** :

- `src/modals/AddGlossary/AddGlossary.tsx`
- `src/modals/AddWord/AddWord.tsx`
- `src/modals/UpdateGlossary/UpdateGlossary.tsx`

**Tâches** :

- [ ] Vérifier les dépendances
- [ ] Mettre à jour si nécessaire
- [ ] Tester les modals

**Effort** : 1 heure

### 2.5 Vérifier Composants sans État ⏳ À FAIRE

**Fichiers** :

- `src/components/Header/Header.tsx`
- Autres composants de présentation

**Tâches** :

- [ ] Vérifier qu'ils ne font pas d'appels au stockage
- [ ] Si oui, refactoriser

**Effort** : 30 minutes

## 📋 Phase 3 : Nettoyage (1 semaine)

### 3.1 Retirer les Wrappers de Compatibilité ⏳ À FAIRE

**Fichiers** :

- `src/utils/api.ts`
- `src/utils/storage.ts`
- `src/domain/glossary.logic.ts`

**Tâches** :

- [ ] S'assurer que TOUS les composants utilisent les services
- [ ] Supprimer les wrappers
- [ ] Mettre à jour les imports dans toute l'app
- [ ] Tester la compilation

**Effort** : 2 heures

### 3.2 Supprimer le Fichier glossary.logic.ts ⏳ À FAIRE

- [ ] Vérifier qu'aucun composant ne l'utilise
- [ ] Supprimer le fichier

### 3.3 Nettoyer les Imports ⏳ À FAIRE

- [ ] Lancer ESLint : `npm run lint`
- [ ] Supprimer les imports inutilisés
- [ ] Fixer les avertissements

## 📋 Phase 4 : Tests d'Intégration (1 semaine)

### 4.1 Tester le Flux Complet ⏳ À FAIRE

**Scénario 1** : Créer, modifier, supprimer

- [ ] Créer un nouveau glossaire
- [ ] Ajouter des mots
- [ ] Modifier un mot
- [ ] Supprimer un mot
- [ ] Supprimer le glossaire
- [ ] Rechargement → données persistent

**Scénario 2** : Export

- [ ] Créer un glossaire avec mots
- [ ] Exporter en JSON
- [ ] Exporter en Markdown
- [ ] Vérifier le format

**Scénario 3** : Parser

- [ ] Charger un fichier Markdown
- [ ] Parser les glossaires
- [ ] Vérifier la conversion

### 4.2 Tests de Performance ⏳ À FAIRE

- [ ] Créer 100 glossaires
- [ ] Créer 1000 mots dans un glossaire
- [ ] Mesurer les temps de réponse
- [ ] Optimiser si nécessaire

### 4.3 Tests d'Erreur ⏳ À FAIRE

- [ ] Overflow de localStorage
- [ ] Nom de glossaire dupliqué
- [ ] Mot dupliqué
- [ ] Erreur réseau (API)
- [ ] Stockage désactivé (private mode)

## 📋 Phase 5 : Documentation Finale (1 semaine)

### 5.1 Mettre à Jour la README ⏳ À FAIRE

- [ ] Ajouter section "Architecture"
- [ ] Lien vers les guides SOLID
- [ ] Guide de contribution pour les nouveaux développeurs

### 5.2 Créer des Examples ⏳ À FAIRE

**Dossier** : `examples/`

- [ ] Exemple d'ajout d'un service custom
- [ ] Exemple d'utilisation IndexedDB
- [ ] Exemple d'extension du Parser

### 5.3 Créer un Guide de Contribution ⏳ À FAIRE

**Fichier** : `CONTRIBUTING.md`

- [ ] Principes SOLID à respecter
- [ ] Structure à suivre
- [ ] Checklist avant PR

### 5.4 Documenter les API Publiques ⏳ À FAIRE

- [ ] Documenter GlossaryService
- [ ] Documenter WordService
- [ ] Documenter DependencyContainer
- [ ] Ajouter des JSDoc

## 📋 Phase 6 : Améliorations Futures (3+ mois)

### 6.1 IndexedDB Provider ⏳ FUTUR

```typescript
// Permettre les gros glossaires
const storage = new IndexedDBProvider()
```

### 6.2 Validation Service ⏳ FUTUR

```typescript
// Valider les données avant sauvegarde
const validation = new ValidationService()
validation.validateGlossary(data)
```

### 6.3 Synchronisation Cloud ⏳ FUTUR

```typescript
// Sync avec le serveur
const sync = new CloudSyncService(apiClient)
```

### 6.4 Authentification ⏳ FUTUR

```typescript
// Glossaires personnels
const auth = new AuthenticationService()
```

### 6.5 Historique/Undo ⏳ FUTUR

```typescript
// Tracer les modifications
const history = new HistoryService()
history.undo()
history.redo()
```

## 📊 Calendrier Estimé

| Phase                   | Durée        | Dates         |
| ----------------------- | ------------ | ------------- |
| 1. Validation           | 1-2 semaines | Maintenant    |
| 2. Migration Composants | 2-4 semaines | Après Phase 1 |
| 3. Nettoyage            | 1 semaine    | Après Phase 2 |
| 4. Tests Intégration    | 1 semaine    | Après Phase 3 |
| 5. Documentation        | 1 semaine    | Après Phase 4 |
| **Total**               | **~2 mois**  |               |

## 🚀 Comment Démarrer

### Jour 1 : Préparation

- [ ] Lire tous les documents de refactorisation
- [ ] Créer une branche `refactor/solid`
- [ ] Exécuter les tests

### Jour 2-3 : Validation

- [ ] Vérifier la compilation
- [ ] Test manuel complet
- [ ] Committer si tout ok

### Semaine 2-3 : Migration

- [ ] Refactoriser `Home/Glossaire.tsx`
- [ ] Refactoriser `Menu.tsx`
- [ ] Tester après chaque migration
- [ ] Committer les changements

### Semaine 4-5 : Nettoyage

- [ ] Retirer les wrappers
- [ ] Nettoyer les imports
- [ ] Lancer ESLint

### Semaine 6 : Tests d'Intégration

- [ ] Tests manuels complets
- [ ] Tests de performance
- [ ] Tests d'erreur

### Semaine 7 : Documentation

- [ ] Mettre à jour la README
- [ ] Créer des exemples
- [ ] Guide de contribution

### Semaine 8+ : Amélioration Future

- [ ] IndexedDB
- [ ] Validation
- [ ] Cloud Sync

## 🎯 Succès Criteria

- [x] Services SOLID créés ✅
- [x] Tests unitaires ✅
- [x] Documentation fournie ✅
- [ ] Tous les tests passent
- [ ] Tous les composants migrés
- [ ] Wrappers supprimés
- [ ] ESLint vert
- [ ] Tests d'intégration valides
- [ ] Zéro breaking changes
- [ ] Documentation à jour

## 📞 Support

En cas de question :

1. Consulter [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
2. Lire [SERVICES_USAGE_GUIDE.md](./SERVICES_USAGE_GUIDE.md)
3. Regarder [REFACTORING_EXAMPLE.md](./REFACTORING_EXAMPLE.md)
4. Examiner les tests pour des exemples

## 📝 Notes

- Chaque phase est testée avant de passer à la suivante
- Migration progressive pour zéro downtime
- Compatibilité maintenue jusqu'à suppression des wrappers
- Documentation régulièrement mise à jour

---

**Créé** : 19 janvier 2026  
**Dernière mise à jour** : 19 janvier 2026  
**Responsable** : Vous 👨‍💻
