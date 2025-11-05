// Small API helper for posting data
export async function postJSON(url: string, data: unknown, timeoutMs = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal,
        });
        clearTimeout(id);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
        }
        return res.json?.() ?? null;
    } finally {
        clearTimeout(id);
    }
}

export async function postWords(url: string, words: unknown) {
    return postJSON(url, { words });
}
