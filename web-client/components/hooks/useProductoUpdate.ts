"use client";

import { useState, useCallback } from "react";

export type ProductoUpdateInput = {
  nombre?: string | null;
  descripcion?: string | null;
  descuento?: number | null; 
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "auth_token";

function parseServerError(raw: string): string {
  if (!raw) return "No se pudo guardar";
  const msg = raw.toUpperCase();
  if (msg.includes("FIELD_REQUIRED:NOMBRE")) return "El campo 'Nombre' es obligatorio.";
  return raw;
}

export function useProductoUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProducto = useCallback(async (id: number, values: ProductoUpdateInput) => {
    setLoading(true);
    setError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

      const res = await fetch(`${API_BASE}/api/productos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nombre: (values.nombre ?? "").trim(),
          descripcion: values.descripcion ?? null,
          descuento: values.descuento ?? null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(parseServerError(text));
      }

      return true;
    } catch (err: any) {
      setError(err?.message ?? "No se pudo guardar");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateProducto, loading, error };
}
