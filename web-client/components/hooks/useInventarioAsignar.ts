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

export function useInventarioAsignar() {
  const { post } = useApi();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const asignar = React.useCallback(
    async (productoID: number, bodegaID: number) => {
      setLoading(true);
      setError(null);

      try {
        if (!isValidPositiveInteger(productoID)) {
          throw new Error("Debe seleccionar un producto válido.");
        }

        if (!isValidPositiveInteger(bodegaID)) {
          throw new Error("Debe seleccionar una bodega válida.");
        }

        await post<void>("/api/inventario/asignar-producto", {
          productoID,
          bodegaID,
        });

        return true;
      } catch (e: unknown) {
        setError(
          getErrorMessage(
            e,
            "No se pudo asignar el producto a la bodega."
          )
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [post]
  );

  return { asignar, loading, error };
}