"use client";

import * as React from "react";
import { useApi } from "./useApi";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isValidPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0
  );
}

export function useInventarioCantidad() {
  const { get } = useApi();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getCantidad = React.useCallback(
    async (productoID: number, bodegaID: number): Promise<number | null> => {
      setLoading(true);
      setError(null);

      try {
        if (!isValidPositiveInteger(productoID)) {
          throw new Error("Producto inválido.");
        }

        if (!isValidPositiveInteger(bodegaID)) {
          throw new Error("Bodega inválida.");
        }

        const params = new URLSearchParams({
          productoID: String(productoID),
          bodegaID: String(bodegaID),
        });

        const res = await get<{ cantidad?: number }>(
          `/api/inventario/cantidad?${params.toString()}`
        );

        return typeof res?.cantidad === "number" && Number.isFinite(res.cantidad)
          ? res.cantidad
          : 0;
      } catch (e: unknown) {
        setError(getErrorMessage(e, "No se pudo cargar el stock actual."));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  return { getCantidad, loading, error };
}