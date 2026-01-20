/**
 * Interface pour le fournisseur de stockage
 * Applique l'Interface Segregation Principle (ISP)
 * Permet de changer le backend de stockage sans modifier la logique métier
 */

export interface IStorageProvider {
  load<T>(key: string, fallback: T): T
  save<T>(key: string, data: T): void
  remove(key: string): void
  clear(): void
}
