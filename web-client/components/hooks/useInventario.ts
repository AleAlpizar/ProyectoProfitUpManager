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

export function useInventario() {
  const { post, put, get } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const asignar = useCallback(
    async (req: AsignarProductoBodegaRequest) => {
      setError(null);
      setLoading(true);
      try {
        if (!req?.productoID || !req?.bodegaID) {
          throw new Error("Debe seleccionar producto y bodega.");
        }
        const res = await post<{ message: string }>(
          "/api/inventario/asignar",
          { productoID: req.productoID, bodegaID: req.bodegaID }
        );
        return { ok: true, data: res } as const;
      } catch (e: any) {
        setError(e?.message ?? "No se pudo asignar");
        return { ok: false } as const;
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
        if (!dto?.productoID || !dto?.bodegaID) {
          throw new Error("Producto y bodega son obligatorios.");
        }
        if (dto.nuevaCantidad < 0) {
          throw new Error("La cantidad no puede ser negativa.");
        }
        const res = await put<{ cantidad: number }>(
          "/api/inventario/cantidad",
          dto
        );
        return { ok: true, data: res } as const;
      } catch (e: any) {
        setError(e?.message ?? "No se pudo actualizar la cantidad");
        return { ok: false } as const;
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
        if (productoID) qs.set("productoID", String(productoID));
        if (bodegaID) qs.set("bodegaID", String(bodegaID));
        const res = await get<any[]>(
          `/api/inventario/stock?${qs.toString()}`
        );
        return { ok: true, data: res } as const;
      } catch (e: any) {
        setError(e?.message ?? "No se pudo consultar stock");
        return { ok: false } as const;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  return { asignar, setCantidad, getStock, loading, error };
}
