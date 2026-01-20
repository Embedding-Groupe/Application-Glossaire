/**
 * Tests unitaires pour WordService
 * Teste la logique métier des mots de manière isolée
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { WordService } from '../application/services/WordService'
import type { WordItem } from '../domain/types/index'
import { IStorageProvider } from '../domain/repositories/IStorageProvider'

// Mock du StorageProvider
class MockStorageProvider implements IStorageProvider {
  private data: Record<string, unknown> = {}

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

describe('WordService', () => {
  let service: WordService
  let storage: MockStorageProvider

  beforeEach(() => {
    storage = new MockStorageProvider()
    service = new WordService(storage, 'TestGlossary')
  })

  describe('addWord', () => {
    it('devrait ajouter un mot au glossaire', () => {
      const word = service.addWord('exemple', 'Un exemple', ['illustration'])

      expect(word.word).toBe('exemple')
      expect(word.definition).toBe('Un exemple')
      expect(word.synonyms).toContain('illustration')
    })

    it('devrait persister le mot en stockage', () => {
      service.addWord('test', 'Une définition', [])
      const stored = storage.load<WordItem[]>('glossary_TestGlossary', [])

      expect(stored).toHaveLength(1)
      expect(stored[0].word).toBe('test')
    })
  })

  describe('updateWord', () => {
    it('devrait mettre à jour un mot existant', () => {
      service.addWord('ancien', 'Ancienne définition', [])
      const updated = service.updateWord(
        'ancien',
        'nouveau',
        'Nouvelle définition',
        ['synonyme']
      )

      expect(updated.word).toBe('nouveau')
      expect(updated.definition).toBe('Nouvelle définition')
    })

    it("devrait lever une erreur si le mot n'existe pas", () => {
      expect(() =>
        service.updateWord('inexistant', 'nouveau', 'def', [])
      ).toThrow()
    })
  })

  describe('deleteWord', () => {
    it('devrait supprimer un mot', () => {
      service.addWord('test', 'Définition', [])
      service.deleteWord('test')

      expect(service.loadWords()).toHaveLength(0)
    })
  })

  describe('searchWords', () => {
    it('devrait trouver les mots par terme', () => {
      service.addWord('exemple', 'Un exemple', [])
      service.addWord('test', 'Un test', [])

      const results = service.searchWords('exemple')
      expect(results).toHaveLength(1)
      expect(results[0].word).toBe('exemple')
    })

    it('devrait chercher dans les définitions aussi', () => {
      service.addWord('test', 'Un exemple de test', [])

      const results = service.searchWords('exemple')
      expect(results).toHaveLength(1)
    })
  })

  describe('wordExists', () => {
    it('devrait vérifier si un mot existe', () => {
      service.addWord('existe', 'Définition', [])

      expect(service.wordExists('existe')).toBe(true)
      expect(service.wordExists('nexiste')).toBe(false)
    })
  })
})
