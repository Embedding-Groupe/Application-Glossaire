/**
 * Conteneur d'injection de dépendances (IoC)
 * Applique l'Inversion of Control Principle (IoC)
 * Gère la création et l'injection des dépendances
 *
 * Utilisation:
 * const container = new DependencyContainer()
 * const glossaryService = container.getGlossaryService()
 */

import { GlossaryRepository } from '../domain/repositories/GlossaryRepository'
import { LocalStorageProvider } from './storage/LocalStorageProvider'
import { ApiClient } from './api/ApiClient'
import { GlossaryService } from '../application/services/GlossaryService'
import { WordService } from '../application/services/WordService'
import { Glossary } from '../domain/types/index'

export class DependencyContainer {
  private static instance: DependencyContainer | undefined
  private storageProvider: LocalStorageProvider
  private apiClient: ApiClient
  private glossaryRepository: GlossaryRepository
  private glossaryService: GlossaryService

  private constructor() {
    // Initialisation des dépendances
    this.storageProvider = new LocalStorageProvider()
    this.apiClient = new ApiClient()

    // Charge les glossaires depuis le stockage
    const initialGlossaries = this.storageProvider.load<Glossary[]>(
      'glossaries',
      []
    )
    this.glossaryRepository = new GlossaryRepository(initialGlossaries)

    // Crée le service avec les dépendances
    this.glossaryService = new GlossaryService(
      this.glossaryRepository,
      this.storageProvider
    )
  }

  /**
   * Récupère l'instance singleton du conteneur
   */
  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer()
    }
    return DependencyContainer.instance
  }

  /**
   * Récupère le service de glossaires
   */
  getGlossaryService(): GlossaryService {
    return this.glossaryService
  }

  /**
   * Crée un service de mots pour un glossaire spécifique
   */
  createWordService(glossaryName: string): WordService {
    return new WordService(this.storageProvider, glossaryName)
  }

  /**
   * Récupère le fournisseur de stockage
   */
  getStorageProvider(): LocalStorageProvider {
    return this.storageProvider
  }

  /**
   * Récupère le client API
   */
  getApiClient(): ApiClient {
    return this.apiClient
  }

  /**
   * Récupère le repository de glossaires
   */
  getGlossaryRepository(): GlossaryRepository {
    return this.glossaryRepository
  }

  /**
   * Réinitialise le conteneur (utile pour les tests)
   */
  static reset(): void {
    DependencyContainer.instance = undefined
  }
}
