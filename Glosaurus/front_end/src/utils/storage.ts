// Simple localStorage helpers with safe fallbacks.
export function loadFromStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

export function saveToStorage<T>(key: string, data: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch {
        // ignore (quota, private mode...)
    }
}

export function clearStorage(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        // ignore
    }
}

export const DEFAULT_STORAGE_KEY = 'glossaire_words';
