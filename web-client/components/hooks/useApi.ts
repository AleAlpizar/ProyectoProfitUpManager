
import { useCallback, useMemo, useState } from "react";
import { useAuthToken } from "./useAuthToken";

export type ApiError = { status: number; message: string; raw?: any };

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.replace(/^\/+/, "");
  return API_BASE ? `${API_BASE}/${clean}` : `/${clean}`;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = buildUrl(path);

  const headers = new Headers(init.headers ?? {});
  const hasBody = init.body !== undefined;

  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (hasBody && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const body =
    hasBody && init.body && typeof init.body !== "string" && !(init.body instanceof FormData)
      ? JSON.stringify(init.body)
      : init.body;

  const res = await fetch(url, { ...init, headers, body, credentials: init.credentials ?? "include" });

  const parse = async () => {
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        const msg = j?.title || j?.detail || j?.message || j?.error || `HTTP ${res.status}`;
        return { ok: res.ok, data: j, message: msg };
      }
      const t = await res.text();
      return { ok: res.ok, data: t, message: t || `HTTP ${res.status}` };
    } catch {
      return { ok: res.ok, data: null, message: `HTTP ${res.status}` };
    }
  };

  const { ok, data, message } = await parse();
  if (!ok) {
    const err: ApiError = { status: res.status, message, raw: data };
    throw err;
  }

  return data as T;
}

export function useApi() {
  const { token, ready } = useAuthToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const withAuth = useCallback(
    (init: RequestInit = {}): RequestInit => {
      const headers = new Headers(init.headers ?? {});
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return { ...init, headers };
    },
    [token]
  );

  const call = useCallback(
    async <T,>(path: string, init: RequestInit = {}) => {
      setLoading(true);
      setError(null);
      try {
        return await apiFetch<T>(path, withAuth(init));
      } catch (e) {
        setError(e as ApiError);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [withAuth]
  );

  const api = useMemo(
    () => ({
      get: <T,>(path: string, init?: RequestInit) =>
        call<T>(path, { ...(init ?? {}), method: "GET" }),
      post: <T,>(path: string, body?: any, init?: RequestInit) =>
        call<T>(path, { ...(init ?? {}), method: "POST", body }),
      put: <T,>(path: string, body?: any, init?: RequestInit) =>
        call<T>(path, { ...(init ?? {}), method: "PUT", body }),
      del: <T,>(path: string, init?: RequestInit) =>
        call<T>(path, { ...(init ?? {}), method: "DELETE" }),
    }),
    [call]
  );

  return { ...api, call, loading, error, ready };
}
