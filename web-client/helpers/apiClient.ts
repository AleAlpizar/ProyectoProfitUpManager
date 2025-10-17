export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiJson<T = any>(
  url: string,
  method: Method = "GET",
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  if (!API_BASE && !url.startsWith("http")) {
    console.warn("NEXT_PUBLIC_API_BASE_URL no está definido y se llamó apiJson con ruta relativa:", url);
  }

  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders || {}),
  };

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
  });

  let payload: any = null;
  try { payload = await res.json(); } catch { }

  if (!res.ok) {
    if (res.status === 401) {
      const msg = payload?.message || "No autorizado";
      throw new Error(msg);
    }
    const msg = payload?.message || payload?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (res.status === 204 || payload === null || typeof payload === "undefined") {
    return undefined as unknown as T;
  }

  return payload as T;
}
