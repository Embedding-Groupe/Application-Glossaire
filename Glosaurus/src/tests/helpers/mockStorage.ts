import { IStorageProvider } from '../../domain/repositories/IStorageProvider'

export class InMemoryStorage implements IStorageProvider {
  private data: Record<string, unknown> = {}

  load<T>(key: string, fallback: T): T {
    return (key in this.data ? this.data[key] : fallback) as T
  }

  save<T>(key: string, value: T): void {
    this.data[key] = value
  }

  remove(key: string): void {
    delete this.data[key]
  }

  clear(): void {
    this.data = {}
  }
}
