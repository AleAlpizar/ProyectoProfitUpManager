"use client";

import { useCallback, useState } from "react";
import { useApi } from "../hooks/useApi";

export type AsignarProductoBodegaRequest = {
  productoID: number;
  bodegaID: number;
};

export type InventarioSetCantidadDto = {
  productoID: number;
  bodegaID: number;
  nuevaCantidad: number;
  motivo?: string | null;
};

type ApiMessageResponse = {
  message?: string;
};

type ApiCantidadResponse = {
  cantidad?: number;
};

function isValidPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useInventario() {
  const { post, put, get } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const asignar = useCallback(
    async (req: AsignarProductoBodegaRequest) => {
      setError(null);
      setLoading(true);

      try {
        if (!isValidPositiveInteger(req?.productoID)) {
          throw new Error("Debe seleccionar un producto válido.");
        }

        if (!isValidPositiveInteger(req?.bodegaID)) {
          throw new Error("Debe seleccionar una bodega válida.");
        }

        const res = await post<ApiMessageResponse>("/api/inventario/asignar", {
          productoID: req.productoID,
          bodegaID: req.bodegaID,
        });

        return { ok: true, data: res } as const;
      } catch (e: unknown) {
        const message = getErrorMessage(
          e,
          "No se pudo asignar el producto a la bodega."
        );
        setError(message);
        return { ok: false, error: message } as const;
      } finally {
        setLoading(false);
      }
    },
    [post]
  );

  const setCantidad = useCallback(
    async (dto: InventarioSetCantidadDto) => {
      setError(null);
      setLoading(true);

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

        const res = await put<ApiCantidadResponse>(
          "/api/inventario/cantidad",
          payload
        );

        return { ok: true, data: res } as const;
      } catch (e: unknown) {
        const message = getErrorMessage(
          e,
          "No se pudo actualizar la cantidad."
        );
        setError(message);
        return { ok: false, error: message } as const;
      } finally {
        setLoading(false);
      }
    },
    [put]
  );

  const getStock = useCallback(
    async (productoID?: number, bodegaID?: number) => {
      setError(null);
      setLoading(true);

      try {
        const qs = new URLSearchParams();

        if (typeof productoID === "number" && Number.isFinite(productoID)) {
          qs.set("productoID", String(productoID));
        }

        if (typeof bodegaID === "number" && Number.isFinite(bodegaID)) {
          qs.set("bodegaID", String(bodegaID));
        }

        const query = qs.toString();
        const url = query
          ? `/api/inventario/stock?${query}`
          : "/api/inventario/stock";

        const res = await get<unknown[]>(url);

        return {
          ok: true,
          data: Array.isArray(res) ? res : [],
        } as const;
      } catch (e: unknown) {
        const message = getErrorMessage(e, "No se pudo consultar el stock.");
        setError(message);
        return { ok: false, error: message, data: [] } as const;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  return { asignar, setCantidad, getStock, loading, error };
}