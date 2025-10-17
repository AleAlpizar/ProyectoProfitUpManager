"use client";

import * as React from "react";
import { useApi } from "./useApi";

export type InventarioSetCantidadDto = {
  productoID: number;
  bodegaID: number;
  nuevaCantidad: number;
  motivo?: string | null;
};

export function useInventarioSetCantidad() {
  const { post } = useApi();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setCantidad = React.useCallback(
    async (dto: InventarioSetCantidadDto) => {
      setLoading(true);
      setError(null);
      try {
        await post<void>("/api/inventario/cantidad/set", dto);
        return true;
      } catch (e: any) {
        setError(e?.message ?? "No se pudo guardar la cantidad.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [post]
  );

  return { setCantidad, loading, error };
}
