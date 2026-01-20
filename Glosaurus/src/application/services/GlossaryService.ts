/**
 * Service applicatif pour la gestion des glossaires
 * Applique l'Inversion of Dependencies Principle (DIP)
 * Dépend des interfaces, pas des implémentations concrètes
 * Orchestre la logique métier et l'accès aux ressources
 */

import { Glossary } from '../../domain/types/index'
import { IGlossaryRepository } from '../../domain/repositories/IGlossaryRepository'
import { IStorageProvider } from '../../domain/repositories/IStorageProvider'

export class GlossaryService {
  private readonly STORAGE_KEY = 'glossaries'

  constructor(
    private repository: IGlossaryRepository,
    private storage: IStorageProvider
  ) {}

  /**
   * Crée un nouveau glossaire et le persiste en stockage
   */
  createGlossary(name: string, description: string, now?: Date): Glossary {
    const glossary = this.repository.create({ name, description }, now)
    this.persistToStorage()
    return glossary
  }

  /**
   * Récupère tous les glossaires depuis le stockage
   */
  loadGlossaries(): Glossary[] {
    const stored = this.storage.load<Glossary[]>(this.STORAGE_KEY, [])
    // Réinitialise le repository avec les données persistées
    return stored
  }

  /**
   * Récupère tous les glossaires
   */
  getAllGlossaries(): Glossary[] {
    return this.repository.getAll()
  }

  /**
   * Récupère un glossaire par son nom
   */
  getGlossary(name: string): Glossary | undefined {
    return this.repository.getByName(name)
  }

  /**
   * Met à jour un glossaire
   */
  updateGlossary(
    oldName: string,
    newName: string,
    newDescription: string,
    now?: Date
  ): Glossary {
    const glossary = this.repository.update(
      oldName,
      newName,
      newDescription,
      now
    )
    this.persistToStorage()
    return glossary
  }

  /**
   * Supprime un glossaire
   */
  deleteGlossary(name: string): void {
    this.repository.remove(name)
    this.persistToStorage()
  }

  /**
   * Filtre les glossaires selon un terme de recherche
   */
  searchGlossaries(search: string): Glossary[] {
    return this.repository.filter(search)
  }

  /**
   * Sauvegarde les glossaires actuels en stockage
   */
  private persistToStorage(): void {
    this.storage.save(this.STORAGE_KEY, this.repository.getAll())
  }
}
