"use client";
import { useEffect, useState, useCallback } from "react";

export type UnidadDto = { unidadID: number; codigo: string; nombre: string; activo: boolean; };
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export function useUnidades() {
  const [data, setData] = useState<UnidadDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/inventario/unidades`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      setData(await res.json());
    } catch (e: any) { setError(e?.message ?? "Error al cargar unidades"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
