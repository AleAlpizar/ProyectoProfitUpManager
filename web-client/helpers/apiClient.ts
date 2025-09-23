
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5240";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}
