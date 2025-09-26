"use client";

import { useEffect, useState } from "react";

export type Bodega = {
  bodegaID: number;
  codigo: string | null;
  nombre: string;
  direccion?: string | null;
  contacto?: string | null;
  isActive: boolean;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export function useBodegas() {
  const [data, setData] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${API_BASE}/api/inventario/bodegas`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
        const json = (await res.json()) as Bodega[];
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e?.message || "No se pudo cargar bodegas.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
