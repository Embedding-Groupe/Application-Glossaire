/**
 * Service applicatif pour la gestion des mots
 * Applique le Single Responsibility Principle (SRP)
 * Responsable de la gestion des mots dans un glossaire
 */

import { WordItem } from '../../domain/types/index'
import { IStorageProvider } from '../../domain/repositories/IStorageProvider'

export class WordService {
  constructor(
    private storage: IStorageProvider,
    private glossaryName: string
  ) {}

  /**
   * Récupère la clé de stockage pour ce glossaire
   */
  private getStorageKey(): string {
    return `glossary_${this.glossaryName}`
  }

  /**
   * Charge tous les mots du glossaire
   */
  loadWords(): WordItem[] {
    return this.storage.load<WordItem[]>(this.getStorageKey(), [])
  }

  /**
   * Ajoute un mot au glossaire
   */
  addWord(word: string, definition: string, synonyms: string[]): WordItem {
    const words = this.loadWords()
    const newWord: WordItem = { word, definition, synonyms }
    words.push(newWord)
    this.storage.save(this.getStorageKey(), words)
    return newWord
  }

  /**
   * Met à jour un mot existant
   */
  updateWord(
    oldWord: string,
    word: string,
    definition: string,
    synonyms: string[]
  ): WordItem {
    const words = this.loadWords()
    const index = words.findIndex((w) => w.word === oldWord)

    if (index === -1) {
      throw new Error(`Word "${oldWord}" not found`)
    }

    const updated: WordItem = { word, definition, synonyms }
    words[index] = updated
    this.storage.save(this.getStorageKey(), words)
    return updated
  }

  /**
   * Supprime un mot du glossaire
   */
  deleteWord(word: string): void {
    const words = this.loadWords()
    const filtered = words.filter((w) => w.word !== word)
    this.storage.save(this.getStorageKey(), filtered)
  }

  /**
   * Récupère un mot spécifique
   */
  getWord(word: string): WordItem | undefined {
    const words = this.loadWords()
    return words.find((w) => w.word === word)
  }

  /**
   * Recherche les mots par terme
   */
  searchWords(search: string): WordItem[] {
    const words = this.loadWords()
    const lowerSearch = search.toLowerCase()
    return words.filter(
      (w) =>
        w.word.toLowerCase().includes(lowerSearch) ||
        w.definition.toLowerCase().includes(lowerSearch)
    )
  }

  /**
   * Vérifie si un mot existe
   */
  wordExists(word: string): boolean {
    const words = this.loadWords()
    return words.some((w) => w.word === word)
  }
}
