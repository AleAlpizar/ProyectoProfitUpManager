"use client";

import React, { useMemo, useState } from "react";
import { useBodegas } from "@/components/hooks/useBodegas";
import BodegasTable from "@/components/bodegas/BodegasTable";
import SectionHeader from "@/components/SectionHeader";
import Spinner from "@/components/Spinner";
import Alert from "@/components/Alert";

type Bodega = {
  bodegaID?: number;
  codigo?: string | null;
  nombre?: string | null;
  direccion?: string | null;
  isActive?: boolean | number | null;
};

export default function BodegasPage() {
  const hook = useBodegas() as {
    data: Bodega[];
    loading: boolean;
    error: string | null;
    reload?: () => void;
  };

  const { data: bodegas, loading, error } = hook;

  const [q, setQ] = useState("");

  const stats = useMemo(() => {
    const list = bodegas ?? [];
    return {
      total: list.length,
      activas: list.filter((b) =>
        typeof b.isActive === "number" ? b.isActive === 1 : Boolean(b.isActive)
      ).length,
    };
  }, [bodegas]);

  const filtered = useMemo(() => {
    const list = bodegas ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;

    return list.filter((b) => {
      const codigo = (b.codigo ?? "").toLowerCase();
      const nombre = (b.nombre ?? "").toLowerCase();
      const direccion = (b.direccion ?? "").toLowerCase();
      return codigo.includes(term) || nombre.includes(term) || direccion.includes(term);
    });
  }, [bodegas, q]);

  const safeReload = () => {
    if (typeof hook.reload === "function") hook.reload();
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader
        title="Bodegas"
        subtitle={`Total: ${stats.total} · Activas: ${stats.activas}`}
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-80">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, nombre o dirección"
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/40
              outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20
            "
          />
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="m21 21-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
          </svg>
        </div>

        <button
          onClick={safeReload}
          disabled={!!loading}
          title="Refrescar"
          className="
            inline-flex items-center justify-center rounded-xl
            border border-white/10 bg-white/5 px-3 py-2 text-sm
            text-white hover:bg-white/10 disabled:opacity-60
            focus:outline-none focus:ring-2 focus:ring-white/20
          "
        >
          {loading ? "Actualizando…" : "Refrescar"}
        </button>
      </div>

      {loading && (
        <div className="mb-3">
          <Spinner />
        </div>
      )}

      {!loading && error && (
        <div className="mb-3">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
          No se encontraron bodegas
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <BodegasTable rows={filtered as any} />
      )}
    </div>
  );
}
