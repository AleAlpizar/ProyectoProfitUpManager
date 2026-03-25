import React from "react";
import type { BodegaDto } from "../hooks/useBodegas";

type Props = {
  items: BodegaDto[];
  loading: boolean;
  error: string | null;
  onEdit: (b: BodegaDto) => void;
  inactivate: (id: number) => Promise<boolean>;
  activate: (id: number) => Promise<boolean>;
  onViewStock?: (b: BodegaDto) => void | Promise<void>;
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
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  const runAction = React.useCallback(
    async (key: string, action: () => Promise<void> | void) => {
      if (busyKey) return;
      setBusyKey(key);
      try {
        await action();
      } finally {
        setBusyKey(null);
      }
    },
    [busyKey]
  );

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 shadow-inner">
        {error}
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-3xl border border-white/5 bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/70">
        No hay bodegas registradas.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((b) => {
        const isActive = typeof b.isActive === "number" ? b.isActive === 1 : !!b.isActive;

        const editKey = `edit-${b.bodegaID}`;
        const stockKey = `stock-${b.bodegaID}`;
        const toggleKey = `${isActive ? "inactivate" : "activate"}-${b.bodegaID}`;

        const isEditing = busyKey === editKey;
        const isViewingStock = busyKey === stockKey;
        const isToggling = busyKey === toggleKey;
        const isBusy = !!busyKey;

        return (
          <article
            key={b.bodegaID}
            className="overflow-hidden rounded-3xl border border-white/10 bg-[#121618] shadow-[0_12px_36px_rgba(0,0,0,.28)] transition hover:-translate-y-0.5 hover:border-white/15"
          >
            <div
              className="flex items-start justify-between gap-3 px-5 py-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(163,8,98,.26) 0%, rgba(163,8,98,.12) 58%, rgba(163,8,98,.06) 100%)",
              }}
            >
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold tracking-wide text-white" title={b.nombre}>
                  {b.nombre}
                </h3>
                <p className="mt-1 truncate text-xs text-white/65" title={b.codigo ?? "Sin código"}>
                  {b.codigo ? `Código: ${b.codigo}` : "Sin código registrado"}
                </p>
              </div>

              <span
                className={[
                  "mt-0.5 inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1",
                  isActive
                    ? "bg-emerald-400/10 text-emerald-200 ring-emerald-400/35"
                    : "bg-rose-400/10 text-rose-200 ring-rose-400/35",
                ].join(" ")}
              >
                {isActive ? "Activa" : "Inactiva"}
              </span>
            </div>

            <div className="px-5 pb-5 pt-4">
              <div className="space-y-2.5 text-sm text-white/85">
                <p
                  className="rounded-xl bg-white/[0.03] px-3 py-2"
                  title={b.direccion ?? "Sin dirección"}
                >
                  <span className="mr-1 text-white/50">Dirección:</span>
                  {b.direccion ?? "Sin dirección"}
                </p>

                <p
                  className="rounded-xl bg-white/[0.03] px-3 py-2"
                  title={b.contacto ?? "Sin contacto"}
                >
                  <span className="mr-1 text-white/50">Contacto:</span>
                  {b.contacto ?? "Sin contacto"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    if (isBusy) return;
                    onEdit(b);
                  }}
                  disabled={loading || isBusy}
                >
                  {isEditing ? "Abriendo…" : "Editar"}
                </button>

                <button
                  type="button"
                  className="rounded-xl border px-3.5 py-2 text-xs font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: `${WINE}14`, borderColor: "rgba(255,255,255,0.12)" }}
                  onClick={() =>
                    runAction(stockKey, async () => {
                      await onViewStock?.(b);
                    })
                  }
                  disabled={loading || isBusy || !onViewStock}
                >
                  {isViewingStock ? "Cargando…" : "Ver existencias"}
                </button>

                {isActive ? (
                  <button
                    type="button"
                    className="rounded-xl border px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: `${WINE}1A`, borderColor: `${WINE}4D` }}
                    onClick={() =>
                      runAction(toggleKey, async () => {
                        await inactivate(b.bodegaID);
                      })
                    }
                    disabled={loading || isBusy}
                  >
                    {isToggling ? "Procesando…" : "Inactivar"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-xl border px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: `${WINE}33`, borderColor: `${WINE}66` }}
                    onClick={() =>
                      runAction(toggleKey, async () => {
                        await activate(b.bodegaID);
                      })
                    }
                    disabled={loading || isBusy}
                  >
                    {isToggling ? "Procesando…" : "Activar"}
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