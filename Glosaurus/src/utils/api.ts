// Small API helper for posting data
export async function postJSON(url: string, data: unknown, timeoutMs = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {

        const win = (window as any).__TAURI__;
        console.debug("api.postJSON: detected tauri?", !!win && typeof win.invoke === 'function');
        if (win && typeof win.invoke === 'function') {

            clearTimeout(id);
            return await win.invoke('proxy_request', {
                method: 'POST',
                url,
                body: data,
            });
        }

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
