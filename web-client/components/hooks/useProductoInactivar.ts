"use client";

import { useCallback, useState } from "react";
import { useApi } from "./useApi"; 

export function useProductoInactivar() {
  const { post } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inactivar = useCallback(async (productoID: number) => {
    setError(null);
    setLoading(true);
    try {
      await post(`/api/productos/${productoID}/inactivar`, {});
      return { ok: true } as const;
    } catch (e: any) {
      setError(e?.message ?? "No se pudo inactivar el producto");
      return { ok: false } as const;
    } finally {
      setLoading(false);
    }
  }, [post]);

  return { inactivar, loading, error };
}
