"use client";

import { useCallback, useState } from "react";
import { useApi } from "./useApi";

function parseErrorMessage(error: any): string {
  const raw = String(error?.message ?? "").trim();
  const msg = raw.toUpperCase();

  if (msg.includes("401")) return "Tu sesión ha expirado. Inicia sesión nuevamente.";
  if (msg.includes("403")) return "No tienes permisos para inactivar productos.";
  if (msg.includes("404")) return "El producto no existe o ya no está disponible.";

  return raw || "No se pudo inactivar el producto.";
}

export function useProductoInactivar() {
  const { post } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inactivar = useCallback(async (productoID: number) => {
    setError(null);

    if (!Number.isInteger(Number(productoID)) || Number(productoID) <= 0) {
      const message = "El identificador del producto no es válido.";
      setError(message);
      return { ok: false as const, message };
    }

    setLoading(true);
    try {
      await post(`/api/productos/${productoID}/inactivar`, {});
      return { ok: true as const };
    } catch (e: any) {
      const message = parseErrorMessage(e);
      setError(message);
      return { ok: false as const, message };
    } finally {
      setLoading(false);
    }
  }, [post]);

  return { inactivar, loading, error };
}