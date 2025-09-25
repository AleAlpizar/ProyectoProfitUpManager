"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type BodegaDto = {
  bodegaID: number;
  codigo?: string | null;
  nombre: string;
  direccion?: string | null;
  contacto?: string | null;
  isActive: boolean;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export function useBodegas() {
  const [data, setData] = useState<BodegaDto[]>([]);
  const [filtered, setFiltered] = useState<BodegaDto[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/inventario/bodegas`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const rows = (await res.json()) as BodegaDto[];
      setData(rows);
      setFiltered(rows);
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return setFiltered(data);
    setFiltered(
      data.filter((b) =>
        [b.codigo ?? "", b.nombre ?? "", b.direccion ?? "", b.contacto ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
    );
  }, [q, data]);

  const stats = useMemo(
    () => ({ total: data.length, activas: data.filter((b) => b.isActive).length }),
    [data]
  );

  return { data, filtered, q, setQ, loading, error, reload, stats };
}
