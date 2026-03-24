"use client";

import { useState, useCallback } from "react";

export type ProductoDetalle = {
  codigoInterno?: string;
  peso?: number | null;
  largo?: number | null;
  alto?: number | null;
  ancho?: number | null;
  unidadAlmacenamientoID?: number | null;
  precioCosto?: number | null;
  precioVenta?: number | null;
  descripcion?: string | null;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "auth_token";

function parseServerError(raw: string, status?: number): string {
  const text = (raw || "").trim();
  const msg = text.toUpperCase();

  if (status === 401) return "Tu sesión ha expirado. Inicia sesión nuevamente.";
  if (status === 403) return "No tienes permisos para consultar este producto.";
  if (status === 404 || msg.includes("NOT FOUND")) return "Producto no encontrado.";

  return text || "No se pudo cargar el detalle del producto.";
}

export function useProductoDetalle() {
  const [detalle, setDetalle] = useState<ProductoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetalle = useCallback(async (id: number) => {
    setError(null);
    setDetalle(null);

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      const message = "El identificador del producto no es válido.";
      setError(message);
      return null;
    }

    if (!API_BASE) {
      const message = "No está configurada la URL base del API.";
      setError(message);
      return null;
    }

    setLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

      const res = await fetch(`${API_BASE}/api/productos/detalle/${id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setError(parseServerError(text, res.status));
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