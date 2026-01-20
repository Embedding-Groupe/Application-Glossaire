/**
 * Interface pour le client API
 * Applique l'Interface Segregation Principle (ISP)
 * Sépare la logique métier de la communication API (SRP)
 */

export interface IApiClient {
  post<T = unknown>(url: string, data: unknown, timeoutMs?: number): Promise<T>
  postWords(url: string, words: unknown): Promise<unknown>
}
