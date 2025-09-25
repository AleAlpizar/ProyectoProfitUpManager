import { useCallback, useState } from "react";

export function useAsync<T extends any[], R>(fn: (...args: T) => Promise<R>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (...args: T) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fn(...args);
      return res;
    } catch (e: any) {
      setError(e?.message ?? "Error");
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fn]);

  return { run, loading, error, setError };
}
