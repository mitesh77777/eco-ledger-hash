const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function joinUrl(base: string, path: string) {
  if (!base) return path;
  if (!path) return base;
  if (base.endsWith("/api") && path.startsWith("/api/")) return base + path.slice(4);
  if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
  return base + path;
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const url = joinUrl(API_URL, path);
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...(opts || {}) });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const d = await res.json(); msg = d?.error || d?.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const authApi = {
  nonce: (accountId: string) => request<{ nonce: string; expiresAt: number }>(`/api/auth/nonce?accountId=${encodeURIComponent(accountId)}`),
  verify: (accountId: string, signature: string) => request<{ token: string; accountId: string; expiresAt: number }>(`/api/auth/verify`, { method: 'POST', body: JSON.stringify({ accountId, signature }) }),
};

export const session = {
  set(token: string) { localStorage.setItem('eco_session', token); },
  get() { return localStorage.getItem('eco_session'); },
  clear() { localStorage.removeItem('eco_session'); },
};
