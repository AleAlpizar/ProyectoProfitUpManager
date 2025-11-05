import React from "react";
import type { BodegaDto } from "../hooks/useBodegas";

type Props = {
  items: BodegaDto[];
  loading: boolean;
  error: string | null;
  onEdit: (b: BodegaDto) => void;
  inactivate: (id: number) => Promise<boolean>;
  activate: (id: number) => Promise<boolean>;
  onViewStock?: (b: BodegaDto) => void; 
};

const WINE = "#A30862";

export default function BodegasCards({
  items,
  loading,
  error,
  onEdit,
  inactivate,
  activate,
  onViewStock,
}: Props) {
  if (error) {
    return (
      <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
        No hay bodegas registradas.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map(b => {
        const isActive = !!b.isActive;
        return (
          <article
            key={b.bodegaID}
            className="overflow-hidden rounded-3xl border border-white/10 bg-[#121618] shadow-[0_10px_30px_rgba(0,0,0,.25)]"
          >
            <div
              className="flex items-start justify-between px-5 py-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(163,8,98,.25) 0%, rgba(163,8,98,.12) 60%, rgba(163,8,98,.08) 100%)",
              }}
            >
              <div>
                <h3 className="text-base font-semibold text-white">{b.nombre}</h3>
                <p className="text-xs text-white/70">{b.codigo ? `Código: ${b.codigo}` : "—"}</p>
              </div>

              <span
                className={[
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                  isActive
                    ? "ring-emerald-400/35 text-emerald-200 bg-emerald-400/10"
                    : "ring-rose-400/35 text-rose-200 bg-rose-400/10",
                ].join(" ")}
              >
                {isActive ? "Activa" : "Inactiva"}
              </span>
            </div>

            <div className="px-5 pb-5 pt-4 text-sm text-white/85">
              <p className="truncate">
                <span className="text-white/60">Dirección: </span>
                {b.direccion ?? "Sin dirección"}
              </p>
              <p className="mt-1 truncate">
                <span className="text-white/60">Contacto: </span>
                {b.contacto ?? "Sin contacto"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                  onClick={() => onEdit(b)}
                >
                  Editar
                </button>

                <button
                  className="rounded-xl border px-3 py-1.5 text-xs font-medium text-white transition"
                  style={{ backgroundColor: `${WINE}14`, borderColor: "rgba(255,255,255,0.12)" }}
                  onClick={() => onViewStock?.(b)} 
                >
                  Ver existencias
                </button>

                {isActive ? (
                  <button
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-white transition"
                    style={{ backgroundColor: `${WINE}1A`, borderColor: `${WINE}4D` }}
                    onClick={() => inactivate(b.bodegaID)}
                  >
                    Inactivar
                  </button>
                ) : (
                  <button
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-white transition"
                    style={{ backgroundColor: `${WINE}33`, borderColor: `${WINE}66` }}
                    onClick={() => activate(b.bodegaID)}
                  >
                    Activar
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
