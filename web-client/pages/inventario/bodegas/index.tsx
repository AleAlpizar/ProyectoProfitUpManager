"use client";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

import { useBodegaDelete } from "@/hooks/useBodegaDelete";
import { useBodegaActivate } from "@/hooks/useBodegaActivate";
import { useApi } from "@/components/hooks/useApi";
import type { BodegaDto } from "@/components/hooks/useBodegas";

import SectionHeader from "@/components/SectionHeader";
import BodegasCards from "@/components/bodegas/BodegasCards";
import BodegaForm from "@/components/bodegas/BodegaForm";

const WINE = "#A30862";
const MAX_MOTIVO = 250;

type ConfirmState =
  | { open: false }
  | {
      open: true;
      kind: "inactivate" | "activate";
      id: number;
      nombre: string;
    };

type EditingState = Partial<BodegaDto> | null;

type ProductoMini = {
  productoID: number;
  sku?: string | null;
  nombre: string;
  descripcion?: string | null;
  descuento?: number | null;
  precioVenta?: number | null;
  isActive?: boolean;
};

type BodegaStockDto = { id: number; nombre: string; cantidad: number };
type ProductoDisponibilidadDto = { id: number; bodegas: BodegaStockDto[] };

type StockRow = {
  productoID: number;
  producto: string;
  sku: string | null;
  existencia: number;
  disponible: number;
};

type EstadoFiltro = "activos" | "inactivos" | "todos";
type TipoMovimiento = "entrada" | "salida" | "ajuste";

const tipoMovimientoOptions: { value: TipoMovimiento; label: string }[] = [
  { value: "entrada", label: "Entrada a bodega" },
  { value: "salida", label: "Salida de bodega" },
  { value: "ajuste", label: "Ajuste directo de existencia" },
];

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message?.trim()) return error.message.trim();
  return fallback;
}

function normalizeBodega(row: BodegaDto): BodegaDto {
  return {
    ...row,
    codigo: row.codigo ?? null,
    direccion: row.direccion ?? null,
    contacto: row.contacto ?? null,
    isActive: typeof row.isActive === "number" ? row.isActive === 1 : !!row.isActive,
  };
}

function ProductSelect({
  value,
  onChange,
  label = "Producto",
  required = false,
  disabled = false,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const { call } = useApi();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ProductoMini[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const rows = await call<ProductoMini[]>("/api/productos/mini?estado=activos", {
          method: "GET",
        });

        if (!active) return;
        setItems((rows ?? []).filter((p) => p.isActive ?? true));
      } catch (e: unknown) {
        if (!active) return;
        setError(getErrorMessage(e, "No se pudieron cargar los productos."));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [call]);

  return (
    <div className="w-full">
      <style jsx global>{`
        select.dark-native-select option {
          background: #0f1214;
          color: #e6e9ea;
        }
        select.dark-native-select optgroup {
          background: #0f1214;
          color: #e6e9ea;
        }
      `}</style>

      <label className="mb-1 block text-xs text-white/70">
        {label} {required && <span className="text-rose-300">*</span>}
      </label>

      <div className="relative">
        <select
          value={value === "" ? "" : Number(value)}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          required={required}
          disabled={disabled || loading}
          className={[
            "dark-native-select",
            "w-full appearance-none rounded-xl border px-3 py-2 text-sm outline-none transition",
            "border-white/10 bg-white/5 text-white",
            "focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40",
            "disabled:cursor-not-allowed disabled:opacity-60",
          ].join(" ")}
        >
          <option value="">{loading ? "Cargando…" : "— Seleccionar —"}</option>
          {items.map((p) => (
            <option key={p.productoID} value={p.productoID}>
              {p.nombre}
            </option>
          ))}
        </select>

        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {error && (
        <div className="mt-2 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-200">
          {error}
        </div>
      )}
    </div>
  );
}

export default function BodegasPage() {
  const { call, post } = useApi();
  const { inactivate, loading: inactLoading, error: inactError } = useBodegaDelete();
  const { activate, loading: actLoading, error: actError } = useBodegaActivate();

  const [rows, setRows] = useState<BodegaDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoFiltro>("activos");
  const [q, setQ] = useState("");

  const [toast, setToast] = useState<{ kind: "ok" | "err" | "warn"; msg: string } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [editing, setEditing] = useState<EditingState>(null);

  const [stockModal, setStockModal] = useState<{
    open: boolean;
    bodega: BodegaDto | null;
    loading: boolean;
    error: string | null;
    rows: StockRow[];
  }>({ open: false, bodega: null, loading: false, error: null, rows: [] });

  const [mov, setMov] = useState<{
    productoID: number | "";
    tipo: "" | TipoMovimiento;
    cantidad: number;
    nuevaExistencia: number;
    motivo: string;
    saving: boolean;
    error: string | null;
  }>({
    productoID: "",
    tipo: "",
    cantidad: 0,
    nuevaExistencia: 0,
    motivo: "",
    saving: false,
    error: null,
  });

  const [confirmMovOpen, setConfirmMovOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const page = await call<{ items?: BodegaDto[]; total?: number } | BodegaDto[]>(
        "/api/bodegas?soloActivas=false&page=1&pageSize=1000",
        { method: "GET" }
      );

      const items = Array.isArray(page) ? page : page?.items ?? [];
      setRows(items.map(normalizeBodega));
    } catch (e: unknown) {
      setRows([]);
      setError(getErrorMessage(e, "Error al cargar bodegas."));
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return rows
      .filter((b) => {
        if (estado === "activos") return !!b.isActive;
        if (estado === "inactivos") return !b.isActive;
        return true;
      })
      .filter((b) => {
        if (!term) return true;
        return (
          (b.codigo ?? "").toLowerCase().includes(term) ||
          (b.nombre ?? "").toLowerCase().includes(term) ||
          (b.direccion ?? "").toLowerCase().includes(term) ||
          (b.contacto ?? "").toLowerCase().includes(term)
        );
      });
  }, [rows, q, estado]);

  const askInactivate = (b: BodegaDto) =>
    setConfirm({ open: true, kind: "inactivate", id: b.bodegaID, nombre: b.nombre ?? "" });

  const askActivate = (b: BodegaDto) =>
    setConfirm({ open: true, kind: "activate", id: b.bodegaID, nombre: b.nombre ?? "" });

  const runConfirm = async () => {
    if (!confirm.open || confirmBusy) return;

    setConfirmBusy(true);
    try {
      if (confirm.kind === "inactivate") {
        const ok = await inactivate(confirm.id);
        if (!ok) throw new Error("No se pudo inactivar.");
        setToast({ kind: "ok", msg: `Bodega “${confirm.nombre}” inactivada correctamente.` });
      } else {
        const ok = await activate(confirm.id);
        if (!ok) throw new Error("No se pudo activar.");
        setToast({ kind: "ok", msg: `Bodega “${confirm.nombre}” activada correctamente.` });
      }

      setConfirm({ open: false });
      await load();
    } catch (e: unknown) {
      setToast({
        kind: "err",
        msg:
          confirm.kind === "inactivate"
            ? getErrorMessage(e, "No se pudo inactivar la bodega.")
            : getErrorMessage(e, "No se pudo activar la bodega."),
      });
    } finally {
      setConfirmBusy(false);
    }
  };

  const onSaved = async (_bodega: BodegaDto) => {
    setEditing(null);
    await load();
    setToast({ kind: "ok", msg: "Bodega guardada correctamente." });
  };

  const selectedProduct = useMemo(
    () => stockModal.rows.find((r) => r.productoID === mov.productoID),
    [stockModal.rows, mov.productoID]
  );

  const resetMovimiento = useCallback(() => {
    setMov({
      productoID: "",
      tipo: "",
      cantidad: 0,
      nuevaExistencia: 0,
      motivo: "",
      saving: false,
      error: null,
    });
    setConfirmMovOpen(false);
  }, []);

  const openStockFor = useCallback(async (b: BodegaDto) => {
    setStockModal({ open: true, bodega: b, loading: true, error: null, rows: [] });
    resetMovimiento();

    try {
      const minis = await call<ProductoMini[]>("/api/productos/mini?estado=activos", {
        method: "GET",
      });

      const activeProducts = (minis ?? []).filter((p) => p.isActive ?? true);
      const ids = activeProducts.map((p) => p.productoID);

      if (ids.length === 0) {
        setStockModal((mod) => ({ ...mod, loading: false, rows: [] }));
        return;
      }

      const query = new URLSearchParams();
      ids.forEach((id) => query.append("ProductoIds", String(id)));

      const disp = await call<ProductoDisponibilidadDto[]>(
        `/api/inventario/disponibilidad-por-productos?${query.toString()}`,
        { method: "GET" }
      );

      const byBodega = new Map<number, number>();
      (disp ?? []).forEach((p) => {
        const bRow = p.bodegas.find((x) => x.id === b.bodegaID);
        byBodega.set(p.id, bRow ? (bRow.cantidad ?? 0) : 0);
      });

      const rowsMap: StockRow[] = activeProducts.map((p) => ({
        productoID: p.productoID,
        producto: p.nombre,
        sku: p.sku ?? null,
        existencia: byBodega.get(p.productoID) ?? 0,
        disponible: byBodega.get(p.productoID) ?? 0,
      }));

      setStockModal((mod) => ({ ...mod, loading: false, rows: rowsMap }));
    } catch (e: unknown) {
      setStockModal((mod) => ({
        ...mod,
        loading: false,
        error: getErrorMessage(e, "No se pudo cargar existencias."),
      }));
    }
  }, [call, resetMovimiento]);

  const closeStock = useCallback(() => {
    setStockModal({ open: false, bodega: null, loading: false, error: null, rows: [] });
    resetMovimiento();
  }, [resetMovimiento]);

  const canConfirmMovimiento = useMemo(() => {
    if (!mov.productoID || !mov.tipo) return false;

    if (mov.tipo === "ajuste") {
      return Number.isFinite(mov.nuevaExistencia) && mov.nuevaExistencia >= 0;
    }

    return Number.isFinite(mov.cantidad) && mov.cantidad > 0;
  }, [mov]);

  const confirmMovimientoLabel = useMemo(() => {
    if (mov.tipo === "entrada") return "Confirmar entrada";
    if (mov.tipo === "salida") return "Confirmar salida";
    if (mov.tipo === "ajuste") return "Confirmar ajuste";
    return "Confirmar movimiento";
  }, [mov.tipo]);

  const onSubmitMovimiento = async () => {
    if (!stockModal.open || !stockModal.bodega || mov.saving) return;

    setMov((s) => ({ ...s, saving: true, error: null }));

    try {
      const productoID = Number(mov.productoID || 0);
      if (!Number.isInteger(productoID) || productoID <= 0) {
        throw new Error("Selecciona un producto válido.");
      }

      if (!mov.tipo) {
        throw new Error("Selecciona el tipo de movimiento.");
      }

      if (mov.motivo.trim().length > MAX_MOTIVO) {
        throw new Error(`El motivo no puede superar los ${MAX_MOTIVO} caracteres.`);
      }

      if (mov.tipo === "ajuste") {
        if (!Number.isFinite(mov.nuevaExistencia) || mov.nuevaExistencia < 0) {
          throw new Error("La nueva existencia no puede ser negativa.");
        }
      } else {
        if (!Number.isFinite(mov.cantidad) || mov.cantidad <= 0) {
          throw new Error("La cantidad a mover debe ser mayor a 0.");
        }
      }

      const cur = await call<{ cantidad: number }>(
        `/api/inventario/cantidad?productoID=${productoID}&bodegaID=${stockModal.bodega.bodegaID}`,
        { method: "GET" }
      );

      const actual = Number(cur?.cantidad ?? 0);

      let nuevaCantidad: number;
      if (mov.tipo === "entrada") {
        nuevaCantidad = actual + mov.cantidad;
      } else if (mov.tipo === "salida") {
        if (mov.cantidad > actual) {
          throw new Error("No hay suficiente stock para realizar la salida.");
        }
        nuevaCantidad = actual - mov.cantidad;
      } else {
        nuevaCantidad = mov.nuevaExistencia;
      }

      await post<void>("/api/inventario/cantidad/set", {
        productoID,
        bodegaID: stockModal.bodega.bodegaID,
        nuevaCantidad,
        motivo: mov.motivo.trim() || null,
      });

      await openStockFor(stockModal.bodega);
      setToast({ kind: "ok", msg: "Movimiento de inventario registrado correctamente." });
      resetMovimiento();
    } catch (e: unknown) {
      const msg = getErrorMessage(e, "No se pudo registrar el movimiento.");
      setMov((s) => ({ ...s, saving: false, error: msg }));
      setToast({ kind: "err", msg });
      return;
    }

    setMov((s) => ({ ...s, saving: false }));
  };

  const stockOverlay =
    typeof document !== "undefined" && stockModal.open && stockModal.bodega
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !mov.saving) closeStock();
            }}
          >
            <div className="flex max-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121618] text-white shadow-2xl">
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(163,8,98,0.25) 0%, rgba(163,8,98,0.08) 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div>
                  <h3 className="text-base font-semibold">
                    Existencias — {stockModal.bodega.nombre}
                  </h3>
                  <p className="text-xs text-white/70">
                    Código: {stockModal.bodega.codigo ?? "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeStock}
                  className="rounded-full px-2 text-white/80 hover:bg-white/10"
                  aria-label="Cerrar"
                  disabled={mov.saving}
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-6">
                {stockModal.loading ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/80">
                    Cargando existencias…
                  </div>
                ) : stockModal.error ? (
                  <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
                    {stockModal.error}
                  </div>
                ) : (
                  <>
                    <div className="max-h-[320px] overflow-auto rounded-xl border border-white/10">
                      <table className="min-w-full border-separate border-spacing-0">
                        <thead>
                          <tr className="bg-[#1C2224] text-left text-xs uppercase tracking-wide text-white/70">
                            <th className="px-4 py-2.5">Producto</th>
                            <th className="px-4 py-2.5">SKU</th>
                            <th className="px-4 py-2.5">Existencia</th>
                            <th className="px-4 py-2.5">Disponible</th>
                          </tr>
                        </thead>
                        <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
                          {stockModal.rows.length === 0 ? (
                            <tr>
                              <td className="px-4 py-3 text-sm text-white/70" colSpan={4}>
                                No hay productos registrados.
                              </td>
                            </tr>
                          ) : (
                            stockModal.rows.map((r, i) => (
                              <tr
                                key={r.productoID}
                                className={i % 2 === 0 ? "bg-white/[.02]" : "bg-transparent"}
                              >
                                <td className="px-4 py-2.5 text-sm text-white">{r.producto}</td>
                                <td className="px-4 py-2.5 text-sm text-white/80">
                                  {r.sku ?? "—"}
                                </td>
                                <td className="px-4 py-2.5 text-sm">
                                  {Number(r.existencia).toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-sm">
                                  {Number(r.disponible).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
                      <h4 className="text-sm font-semibold">
                        Agregar o ajustar stock en esta bodega
                      </h4>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="md:col-span-1">
                          <ProductSelect
                            value={mov.productoID}
                            onChange={(v) => setMov((s) => ({ ...s, productoID: v, error: null }))}
                            label="Producto *"
                            required
                            disabled={mov.saving}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-white/70">
                            Tipo de movimiento <span className="text-rose-300">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={mov.tipo}
                              onChange={(e) =>
                                setMov((s) => ({
                                  ...s,
                                  tipo: e.target.value as TipoMovimiento,
                                  cantidad: 0,
                                  nuevaExistencia: 0,
                                  error: null,
                                }))
                              }
                              disabled={mov.saving}
                              className="dark-native-select w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="">— Seleccionar —</option>
                              {tipoMovimientoOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <svg
                              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-white/70">
                            {mov.tipo === "ajuste" ? "Nueva existencia *" : "Cantidad a mover *"}
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={mov.tipo === "ajuste" ? mov.nuevaExistencia : mov.cantidad}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const val = raw === "" ? 0 : Number(raw);

                              setMov((s) =>
                                s.tipo === "ajuste"
                                  ? { ...s, nuevaExistencia: val, error: null }
                                  : { ...s, cantidad: val, error: null }
                              );
                            }}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
                            placeholder="0"
                            disabled={mov.saving}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-1 block text-xs text-white/70">Motivo</label>
                        <input
                          value={mov.motivo}
                          onChange={(e) =>
                            setMov((s) => ({ ...s, motivo: e.target.value, error: null }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
                          placeholder="Conteo físico, merma, etc."
                          disabled={mov.saving}
                          maxLength={MAX_MOTIVO}
                        />
                        <div className="mt-1 text-right text-[11px] text-white/45">
                          {mov.motivo.length}/{MAX_MOTIVO}
                        </div>
                      </div>

                      {mov.error && (
                        <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                          {mov.error}
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setConfirmMovOpen(true)}
                          disabled={mov.saving || !canConfirmMovimiento}
                          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ backgroundColor: WINE }}
                        >
                          {mov.saving ? "Guardando…" : confirmMovimientoLabel}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {confirmMovOpen && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121618] p-5 text-white shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">Guardar cambios</h4>
                    <button
                      type="button"
                      className="rounded-full px-2 text-white/80 hover:bg-white/10"
                      aria-label="Cerrar"
                      onClick={() => setConfirmMovOpen(false)}
                      disabled={mov.saving}
                    >
                      ×
                    </button>
                  </div>

                  <p className="mt-4 text-sm text-white/80">
                    ¿Deseas guardar los cambios del movimiento
                    {selectedProduct ? (
                      <>
                        {" "}
                        del producto <span className="font-semibold">{selectedProduct.producto}</span>?
                      </>
                    ) : (
                      "?"
                    )}
                  </p>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmMovOpen(false)}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={mov.saving}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setConfirmMovOpen(false);
                        await onSubmitMovimiento();
                      }}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ backgroundColor: WINE }}
                      disabled={mov.saving}
                    >
                      Sí, guardar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader title="Bodegas" subtitle={`Total: ${rows.length}`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, nombre, dirección o contacto"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/20 focus:ring-2 focus:ring-white/20"
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </div>

        <div className="relative">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoFiltro)}
            className="appearance-none rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2 pr-9 text-sm text-white outline-none focus:border-white/20"
          >
            <option value="activos">Activas</option>
            <option value="inactivos">Inactivas</option>
            <option value="todos">Todas</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
            ▾
          </span>
        </div>

        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refrescando…" : "Refrescar"}
        </button>

        <button
          type="button"
          onClick={() => setEditing({})}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
          style={{ backgroundColor: WINE }}
        >
          Nueva bodega
        </button>
      </div>

      {toast && (
        <div
          className={[
            "mb-3 rounded-xl px-4 py-2 text-sm",
            toast.kind === "ok"
              ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : toast.kind === "warn"
              ? "border border-amber-400/30 bg-amber-400/10 text-amber-200"
              : "border border-rose-400/30 bg-rose-400/10 text-rose-200",
          ].join(" ")}
          role="status"
        >
          {toast.msg}
        </div>
      )}

      {(inactError || actError) && (
        <div className="mb-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
          {inactError || actError}
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <BodegasCards
        items={filtered}
        loading={loading || inactLoading || actLoading}
        error={null}
        onEdit={(b) => setEditing(b)}
        inactivate={async (id) => {
          const b = rows.find((x) => x.bodegaID === id);
          if (b) askInactivate(b);
          return true;
        }}
        activate={async (id) => {
          const b = rows.find((x) => x.bodegaID === id);
          if (b) askActivate(b);
          return true;
        }}
        onViewStock={openStockFor}
      />

      {editing && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditing(null);
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#121618] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <h3 className="text-base font-semibold text-white">
                {editing?.bodegaID ? "Editar bodega" : "Nueva bodega"}
              </h3>
              <button
                type="button"
                className="rounded-full px-2 text-white/80 hover:bg-white/10"
                aria-label="Cerrar"
                onClick={() => setEditing(null)}
              >
                ×
              </button>
            </div>
            <div className="p-5">
              <BodegaForm
                initial={editing}
                onSaved={onSaved}
                onClose={() => setEditing(null)}
              />
            </div>
          </div>
        </div>
      )}

      {confirm.open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121618] p-5 text-white shadow-2xl">
            <h4 className="text-lg font-semibold">
              {confirm.kind === "inactivate" ? "Inactivar bodega" : "Reactivar bodega"}
            </h4>
            <p className="mt-2 text-sm text-white/80">
              ¿Confirma que desea {confirm.kind === "inactivate" ? "inactivar" : "reactivar"} la
              bodega <span className="font-semibold">“{confirm.nombre}”</span>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm({ open: false })}
                disabled={confirmBusy}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={runConfirm}
                disabled={confirmBusy}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: WINE }}
              >
                {confirmBusy ? "Procesando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {stockOverlay}
    </div>
  );
}