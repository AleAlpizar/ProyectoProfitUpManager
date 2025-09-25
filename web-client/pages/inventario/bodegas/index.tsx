import React from "react";
import { useBodegas } from "@/components/hooks/useBodegas";
import BodegasTable from "@/components/bodegas/BodegasTable";
import SectionHeader from "@/components/SectionHeader"; 
import Spinner from "@/components/Spinner";              
import Alert from "@/components/Alert";  

export default function BodegasPage() {
  const { filtered, q, setQ, loading, error, reload, stats } = useBodegas();

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader title="Bodegas" subtitle={`Total: ${stats.total} · Activas: ${stats.activas}`} />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código, nombre o dirección"
          className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm outline-none transition focus:border-gray-400 md:w-72"
        />
        <button
          onClick={reload}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          title="Refrescar"
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
        <div className="rounded-xl border border-gray-200 bg-white/60 p-6 text-center text-sm text-gray-500">
          No se encontraron bodegas
        </div>
      )}

      {!loading && !error && filtered.length > 0 && <BodegasTable rows={filtered} />}
    </div>
  );
}
