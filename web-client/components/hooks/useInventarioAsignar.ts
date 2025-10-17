"use client";

import * as React from "react";
import { useApi } from "./useApi";

export function useInventarioAsignar() {
  const { post } = useApi();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const asignar = React.useCallback(
    async (productoID: number, bodegaID: number) => {
      setLoading(true);
      setError(null);
      try {
        await post<void>("/api/inventario/asignar-producto", { productoID, bodegaID });
        return true;
      } catch (e: any) {
        setError(e?.message ?? "No se pudo asignar el producto a la bodega.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [post]
  );

  return { asignar, loading, error };
}
