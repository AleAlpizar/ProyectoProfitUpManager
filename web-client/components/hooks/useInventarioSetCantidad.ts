"use client";

import * as React from "react";
import { useApi } from "./useApi";

export type InventarioSetCantidadDto = {
  productoID: number;
  bodegaID: number;
  nuevaCantidad: number;
  motivo?: string | null;
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

export function useInventarioSetCantidad() {
  const { post } = useApi();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setCantidad = React.useCallback(
    async (dto: InventarioSetCantidadDto) => {
      setLoading(true);
      setError(null);

      try {
        if (!isValidPositiveInteger(dto?.productoID)) {
          throw new Error("Producto inválido.");
        }

        if (!isValidPositiveInteger(dto?.bodegaID)) {
          throw new Error("Bodega inválida.");
        }

        if (
          typeof dto?.nuevaCantidad !== "number" ||
          !Number.isFinite(dto.nuevaCantidad)
        ) {
          throw new Error("La nueva cantidad no es válida.");
        }

        if (dto.nuevaCantidad < 0) {
          throw new Error("La cantidad no puede ser negativa.");
        }

        const payload: InventarioSetCantidadDto = {
          ...dto,
          motivo: dto.motivo?.trim() ? dto.motivo.trim() : null,
        };

        await post<void>("/api/inventario/cantidad/set", payload);
        return true;
      } catch (e: unknown) {
        setError(getErrorMessage(e, "No se pudo guardar la cantidad."));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [post]
  );

  return { setCantidad, loading, error };
}
