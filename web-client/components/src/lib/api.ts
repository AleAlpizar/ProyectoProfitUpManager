export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type ApiError = { status: number; message: string; raw?: any };

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error || j?.message || msg;
      if (res.status === 401) {
        console.warn("401 sin autorización. Token presente?:", !!token);
      }
      throw { status: res.status, message: msg, raw: j } as ApiError;
    } catch {
      throw { status: res.status, message: msg } as ApiError;
    }
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}
