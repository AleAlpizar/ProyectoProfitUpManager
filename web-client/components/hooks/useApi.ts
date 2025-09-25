import { useAuthToken } from "./useAuthToken";
import { apiFetch, ApiError } from "../../src/lib/api";
import { useCallback, useState } from "react";

export function useApi() {
  const { token, ready } = useAuthToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const call = useCallback(
    async <T,>(path: string, options?: RequestInit) => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<T>(path, options, token || undefined);
        return data;
      } catch (e: any) {
        setError(e as ApiError);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { call, loading, error, ready };
}
