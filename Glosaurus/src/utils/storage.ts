/**
 * DEPRECATED: Wrapper de stockage pour la compatibilité rétroactive
 *
 * Les nouvelles implémentations doivent utiliser:
 * @see src/infrastructure/storage/LocalStorageProvider.ts
 * @see src/infrastructure/DependencyContainer.ts
 */

import { DependencyContainer } from '../infrastructure/DependencyContainer'

const container = DependencyContainer.getInstance()
const storageProvider = container.getStorageProvider()

// Réexporte les fonctions pour la compatibilité
export function loadFromStorage<T>(key: string, fallback: T): T {
  return storageProvider.load(key, fallback)
}

export function saveToStorage<T>(key: string, data: T): void {
  storageProvider.save(key, data)
}

export function clearStorage(key: string): void {
  storageProvider.remove(key)
}

export const DEFAULT_STORAGE_KEY = 'glossaire_words'
