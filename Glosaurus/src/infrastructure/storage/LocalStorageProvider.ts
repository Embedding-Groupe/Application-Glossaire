/**
 * Implémentation concrète du fournisseur de stockage localStorage
 * Respecte le Single Responsibility Principle (SRP)
 * Contient uniquement la logique d'accès au stockage
 */

import { IStorageProvider } from '../../domain/repositories/IStorageProvider'

export class LocalStorageProvider implements IStorageProvider {
  load<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      console.warn(`Failed to load from storage key: ${key}`)
      return fallback
    }
  }

  save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      console.warn(`Failed to save to storage key: ${key}`)
      // Ignore quota exceeded, private mode, etc.
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      console.warn(`Failed to remove storage key: ${key}`)
    }
  }

  clear(): void {
    try {
      localStorage.clear()
    } catch {
      console.warn('Failed to clear storage')
    }
  }
}
