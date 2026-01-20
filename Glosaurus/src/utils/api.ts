/**
 * DEPRECATED: Wrapper API pour la compatibilité rétroactive
 *
 * Les nouvelles implémentations doivent utiliser:
 * @see src/infrastructure/api/ApiClient.ts
 * @see src/infrastructure/DependencyContainer.ts
 */

import { DependencyContainer } from '../infrastructure/DependencyContainer'

const container = DependencyContainer.getInstance()
const apiClient = container.getApiClient()

// Réexporte les fonctions pour la compatibilité
export async function postJSON(url: string, data: unknown, timeoutMs = 10000) {
  return apiClient.post(url, data, timeoutMs)
}

export async function postWords(url: string, words: unknown) {
  return apiClient.postWords(url, words)
}
