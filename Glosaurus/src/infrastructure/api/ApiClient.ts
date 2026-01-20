/**
 * Implémentation concrète du client API
 * Respecte le Single Responsibility Principle (SRP)
 * Contient uniquement la logique de communication API
 */

import { IApiClient } from '../../domain/repositories/IApiClient'

type TauriGlobal =
  | {
      invoke: (cmd: string, args?: unknown) => Promise<unknown>
    }
  | undefined

export class ApiClient implements IApiClient {
  async post<T = unknown>(
    url: string,
    data: unknown,
    timeoutMs = 10000
  ): Promise<T> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const tauri = this.detectTauri()

      if (tauri && typeof tauri.invoke === 'function') {
        clearTimeout(id)
        return (await tauri.invoke('proxy_request', {
          method: 'POST',
          url,
          body: data,
        })) as T
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      clearTimeout(id)

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`)
      }

      // Always await JSON to return the resolved value of type T
      return (await res.json()) as T
    } finally {
      clearTimeout(id)
    }
  }

  async postWords(url: string, words: unknown): Promise<unknown> {
    return this.post(url, { words })
  }

  private detectTauri(): TauriGlobal {
    return (window as { __TAURI__?: TauriGlobal }).__TAURI__
  }
}
