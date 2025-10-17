

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

export type ApiError = { status: number; message: string; raw?: any };

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.replace(/^\/+/, "");
  return API_BASE ? `${API_BASE}/${clean}` : `/${clean}`;
}

function getBearer(token?: string): string | undefined {
  if (token) return `Bearer ${token}`;
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    if (t) return `Bearer ${t}`;
  }
  return undefined;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const url = buildUrl(path);

  const headers = new Headers(options.headers ?? {});
  const bearer = getBearer(token);
  if (bearer && !headers.has("Authorization")) headers.set("Authorization", bearer);

  const hasBody = options.body !== undefined;
  if (hasBody && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const init: RequestInit = {
    credentials: options.credentials ?? "include",
    ...options,
    headers
  };

  if (hasBody && options.body && typeof options.body !== "string" && !(options.body instanceof FormData)) {
    init.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, init);

  const parseProblem = async () => {
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        const msg =
          j?.title || j?.detail || j?.message || j?.error || (typeof j === "string" ? j : `HTTP ${res.status}`);
        return { message: msg, raw: j };
      }
      const t = await res.text();
      return { message: t || `HTTP ${res.status}` };
    } catch {
      return { message: `HTTP ${res.status}` };
    }
  };

  if (!res.ok) {
    const { message, raw } = await parseProblem();
    if (res.status === 401) {
      console.warn("401 sin autorización. Token presente?:", !!bearer);
    }
    const err: ApiError = { status: res.status, message, raw };
    throw err;
  }

  if (res.status === 204 || res.status === 205) return {} as T;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  } else {
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return (text as unknown) as T;
    }
  }
}
