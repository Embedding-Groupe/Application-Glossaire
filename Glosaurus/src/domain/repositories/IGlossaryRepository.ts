/**
 * Interface pour le repository de glossaires
 * Applique l'Interface Segregation Principle (ISP)
 * Dépend d'une abstraction, pas d'une implémentation concrète (DIP)
 */

import { Glossary } from '../types/index'

export interface IGlossaryRepository {
  create(data: { name: string; description: string }, now?: Date): Glossary
  update(
    oldName: string,
    newName: string,
    newDescription: string,
    now?: Date
  ): Glossary
  remove(name: string): void
  getAll(): Glossary[]
  getByName(name: string): Glossary | undefined
  filter(search: string): Glossary[]
}
