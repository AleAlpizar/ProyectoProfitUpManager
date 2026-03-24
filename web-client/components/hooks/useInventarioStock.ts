"use client";

import { useState, useCallback } from "react";
import { useApi } from "./useApi";

export type StockRow = {
  inventarioID: number;
  productoID: number;
  bodegaID: number;
  bodega: string;
  sku?: string | null;
  producto: string;
  existencia: number;
  reservada: number;
  disponible: number;
  fechaUltimaActualizacion: string;
};

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

export function useInventarioStock() {
  const { get } = useApi();
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadByProducto = useCallback(
    async (productoID: number) => {
      setLoading(true);
      setError(null);

      try {
        if (!isValidPositiveInteger(productoID)) {
          throw new Error("Debe indicar un producto válido.");
        }

        const params = new URLSearchParams({
          productoID: String(productoID),
        });

        const data = await get<StockRow[]>(
          `/api/inventario/stock?${params.toString()}`
        );

        setRows(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        setError(getErrorMessage(e, "No se pudo obtener el stock."));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  return { rows, loadByProducto, loading, error };
}