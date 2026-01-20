/**
 * Implémentation concrète du repository de glossaires
 * Respecte le Single Responsibility Principle (SRP)
 * Contient uniquement la logique métier des glossaires
 */

import { Glossary } from '../types/index'
import { IGlossaryRepository } from './IGlossaryRepository'

export class GlossaryRepository implements IGlossaryRepository {
  private glossaries: Glossary[] = []

  constructor(initialGlossaries: Glossary[] = []) {
    this.glossaries = [...initialGlossaries]
  }

  create(
    data: { name: string; description: string },
    now = new Date()
  ): Glossary {
    const newGlossary: Glossary = {
      ...data,
      lastModified: now.toLocaleString(),
    }
    this.glossaries.push(newGlossary)
    return newGlossary
  }

  update(
    oldName: string,
    newName: string,
    newDescription: string,
    now = new Date()
  ): Glossary {
    const index = this.glossaries.findIndex((g) => g.name === oldName)
    if (index === -1) {
      throw new Error(`Glossary "${oldName}" not found`)
    }

    const updated: Glossary = {
      name: newName,
      description: newDescription,
      lastModified: now.toLocaleString(),
    }
    this.glossaries[index] = updated
    return updated
  }

  remove(name: string): void {
    const index = this.glossaries.findIndex((g) => g.name === name)
    if (index === -1) {
      throw new Error(`Glossary "${name}" not found`)
    }
    this.glossaries.splice(index, 1)
  }

  getAll(): Glossary[] {
    return [...this.glossaries]
  }

  getByName(name: string): Glossary | undefined {
    return this.glossaries.find((g) => g.name === name)
  }

  filter(search: string): Glossary[] {
    const lowerSearch = search.toLowerCase()
    return this.glossaries.filter((g) =>
      g.name.toLowerCase().includes(lowerSearch)
    )
  }
}
