import React from "react";
import type { BodegaDto } from "../hooks/useBodegas";

type Props = {
  items: BodegaDto[];
  loading: boolean;
  error: string | null;
  onEdit: (b: BodegaDto) => void;
  inactivate: (id: number) => Promise<boolean>;
  activate: (id: number) => Promise<boolean>; // 👈 nueva prop
};

export default function BodegasCards({
  items,
  loading,
  error,
  onEdit,
  inactivate,
  activate, // 👈 nueva
}: Props) {
  if (error) {
    return (
      <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
        Cargando…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
        No hay bodegas registradas.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((b) => {
        const isActive = !!b.isActive; // por si viene como 0/1
        return (
          <article
            key={b.bodegaID}
            className="rounded-xl border border-white/10 bg-[#121618] p-4"
          >
            <header className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">{b.nombre}</h3>
                <p className="text-xs text-white/60">
                  {b.codigo ? `Código: ${b.codigo}` : "—"}
                </p>
              </div>

              <span
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border",
                  isActive
                    ? "border-emerald-600/30 text-emerald-300 bg-emerald-600/10"
                    : "border-red-600/30 text-red-300 bg-red-600/10",
                ].join(" ")}
              >
                {isActive ? "ACTIVA" : "INACTIVA"}
              </span>
            </header>

            <p className="text-sm text-white/80">{b.direccion ?? "Sin dirección"}</p>
            <p className="mt-1 text-sm text-white/60">{b.contacto ?? "Sin contacto"}</p>

            <div className="mt-3 flex gap-2">
              <button
                className="rounded-md border border-white/10 px-3 py-1 text-xs text-white hover:bg-white/10"
                onClick={() => onEdit(b)}
              >
                Editar
              </button>

              {isActive ? (
                <button
                  className="rounded-md bg-red-600/80 px-3 py-1 text-xs text-white hover:opacity-90"
                  onClick={() => inactivate(b.bodegaID)}
                >
                  Inactivar
                </button>
              ) : (
                <button
                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs text-white hover:opacity-90"
                  onClick={() => activate(b.bodegaID)}
                >
                  Activar
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
