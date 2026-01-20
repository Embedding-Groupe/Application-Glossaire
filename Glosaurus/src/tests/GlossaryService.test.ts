/**
 * Tests unitaires pour GlossaryService
 * Teste la logique métier des glossaires de manière isolée
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GlossaryService } from '../application/services/GlossaryService'
import { GlossaryRepository } from '../domain/repositories/GlossaryRepository'
import { IStorageProvider } from '../domain/repositories/IStorageProvider'
import type { Glossary } from '../domain/types/index'

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

describe('GlossaryService', () => {
  let service: GlossaryService
  let repository: GlossaryRepository
  let storage: MockStorageProvider

  beforeEach(() => {
    repository = new GlossaryRepository()
    storage = new MockStorageProvider()
    service = new GlossaryService(repository, storage)
  })

  describe('createGlossary', () => {
    it('devrait créer un nouveau glossaire', () => {
      const now = new Date('2024-01-01')
      const glossary = service.createGlossary('Test', 'Description', now)

      expect(glossary.name).toBe('Test')
      expect(glossary.description).toBe('Description')
      expect(glossary.lastModified).toBe(now.toLocaleString())
    })

    it('devrait persister le glossaire en stockage', () => {
      service.createGlossary('Test', 'Description')
      const stored = storage.load<Glossary[]>('glossaries', [])

      expect(stored).toHaveLength(1)
      expect(stored[0].name).toBe('Test')
    })
  })

  describe('updateGlossary', () => {
    it('devrait mettre à jour un glossaire existant', () => {
      service.createGlossary('Old', 'Description')
      const now = new Date('2024-01-02')
      const updated = service.updateGlossary(
        'Old',
        'New',
        'New Description',
        now
      )

      expect(updated.name).toBe('New')
      expect(updated.description).toBe('New Description')
    })

    it("devrait lever une erreur si le glossaire n'existe pas", () => {
      expect(() =>
        service.updateGlossary('NonExistent', 'New', 'Description')
      ).toThrow()
    })
  })

  describe('deleteGlossary', () => {
    it('devrait supprimer un glossaire', () => {
      service.createGlossary('Test', 'Description')
      service.deleteGlossary('Test')

      expect(service.getAllGlossaries()).toHaveLength(0)
    })
  })

  describe('searchGlossaries', () => {
    it('devrait trouver les glossaires correspondant au terme de recherche', () => {
      service.createGlossary('Python', 'Langage Python')
      service.createGlossary('JavaScript', 'Langage JS')
      service.createGlossary('Pythonista', 'Terme non trouvé')

      const results = service.searchGlossaries('python')
      expect(results).toHaveLength(2)
      expect(results[0].name).toBe('Python')
    })
  })
})
