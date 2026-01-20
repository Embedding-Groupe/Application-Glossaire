/**
 * DEPRECATED: Ce fichier est conservé pour la compatibilité rétroactive
 *
 * Les nouvelles implémentations doivent utiliser:
 * - GlossaryService pour la logique métier des glossaires
 * - WordService pour la logique métier des mots
 * - GlossaryRepository pour l'accès aux données
 *
 * @see src/application/services/GlossaryService.ts
 * @see src/application/services/WordService.ts
 * @see src/domain/repositories/GlossaryRepository.ts
 */

export type { Glossary } from './types/index'

// Réexporte les fonctions pures pour la compatibilité
import type { Glossary } from './types/index'

export function createGlossary(
  glossaries: Glossary[],
  data: { name: string; description: string },
  now = new Date()
): Glossary[] {
  return [
    ...glossaries,
    {
      ...data,
      lastModified: now.toLocaleString(),
    },
  ]
}

export function removeGlossary(
  glossaries: Glossary[],
  index: number
): Glossary[] {
  return glossaries.filter((_, i) => i !== index)
}

export function updateGlossary(
  glossaries: Glossary[],
  oldName: string,
  newName: string,
  newDescription: string,
  now = new Date()
): Glossary[] {
  return glossaries.map((g) =>
    g.name === oldName
      ? {
          ...g,
          name: newName,
          description: newDescription,
          lastModified: now.toLocaleString(),
        }
      : g
  )
}

export function filterGlossaries(
  glossaries: Glossary[],
  search: string
): Glossary[] {
  return glossaries.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )
}
