"use client";

import { useState, useCallback } from "react";

export type ProductoDetalle = {
  codigoInterno?: string;
  peso?: number;
  largo?: number;
  alto?: number;
  ancho?: number;
  unidadAlmacenamientoID?: number;
  precioCosto?: number;
  precioVenta?: number;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

function parseServerError(raw: string): string {
  if (!raw) return "No se pudo cargar el detalle del producto.";
  if (raw.toUpperCase().includes("NOT FOUND")) return "Producto no encontrado";
  return raw;
}

export function useProductoDetalle() {
  const [detalle, setDetalle] = useState<ProductoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetalle = useCallback(async (id: number) => {
    setError(null);
    setDetalle(null);
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(`${API_BASE}/api/inventario/productos/detalle/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setError(parseServerError(text));
        return null;
      }

      const data = (await res.json()) as ProductoDetalle;
      setDetalle(data);
      return data;
    } catch (err: any) {
      setError(parseServerError(err?.message));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { detalle, loadDetalle, loading, error };
}
