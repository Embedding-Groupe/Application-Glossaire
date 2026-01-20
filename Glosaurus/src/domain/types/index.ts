/**
 * Types et interfaces pour le domaine des glossaires
 * Respecte les principes SOLID en définissant des contrats clairs
 */

export interface Glossary {
  name: string
  description: string
  lastModified: string
}

export interface WordItem {
  word: string
  definition: string
  synonyms: string[]
}

export interface GlossaryData {
  words: WordItem[]
  metadata: Glossary
}
