"use client";
import React, { useMemo, useState } from "react";

import { useBodegas, type BodegaDto } from "@/hooks/useBodegas";
import { useBodegaDelete } from "@/hooks/useBodegaDelete";
import { useBodegaActivate } from "@/hooks/useBodegaActivate"; 

import SectionHeader from "@/components/SectionHeader";
import BodegasCards from "@/components/bodegas/BodegasCards";
import BodegaForm from "@/components/bodegas/BodegaForm";

export default function BodegasPage() {
  const { data, loading, error, reload } = useBodegas();
  const { inactivate, loading: inactLoading, error: inactError } = useBodegaDelete();
  const { activate, loading: actLoading,   error: actError   } = useBodegaActivate();

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<BodegaDto | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter(
      (b) =>
        (b.codigo ?? "").toLowerCase().includes(term) ||
        (b.nombre ?? "").toLowerCase().includes(term) ||
        (b.direccion ?? "").toLowerCase().includes(term)
    );
  }, [q, data]);

  const handleInactivate = async (id: number) => {
    const ok = await inactivate(id);
    if (ok) reload();
    return ok;
  };

  const handleActivate = async (id: number) => {
    const ok = await activate(id);
    if (ok) reload();
    return ok;
  };

  const onSaved = () => {
    setEditing(null);
    reload();
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader title="Bodegas" subtitle={`Total: ${data.length}`} />

      <div className="mb-4 flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código, nombre o dirección"
          className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/20 focus:ring-2 focus:ring-white/20"
        />
        <button onClick={reload} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
          Refrescar
        </button>
        <button onClick={() => setEditing({} as BodegaDto)} className="rounded-xl bg-[#A30862] px-3 py-2 text-sm text-white">
          Nueva bodega
        </button>
      </div>

      {(inactError || actError) && (
        <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {inactError || actError}
        </div>
      )}

      <BodegasCards
        items={filtered}
        loading={loading || inactLoading || actLoading}
        error={error}
        onEdit={(b) => setEditing(b)}
        inactivate={handleInactivate}
        activate={handleActivate} 
      />

      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditing(null);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121618] p-5">
            <BodegaForm initial={editing} onSaved={onSaved} onClose={() => setEditing(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
