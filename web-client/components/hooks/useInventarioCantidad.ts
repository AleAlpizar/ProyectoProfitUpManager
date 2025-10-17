"use client";

import * as React from "react";
import { useApi } from "./useApi";

export function useInventarioCantidad() {
  const { get } = useApi();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getCantidad = React.useCallback(
    async (productoID: number, bodegaID: number): Promise<number | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await get<{ cantidad: number }>(
          `/api/inventario/cantidad?productoID=${productoID}&bodegaID=${bodegaID}`
        );
        return typeof res?.cantidad === "number" ? res.cantidad : 0;
      } catch (e: any) {
        setError(e?.message ?? "No se pudo cargar el stock actual.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  return { getCantidad, loading, error };
}
