"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import SectionHeader from "@/components/SectionHeader";
import { useApi } from "@/components/hooks/useApi";

type BodegaOption = {
  bodegaID: number;
  nombre: string;
  codigo?: string | null;
};

type ProductoOption = {
  productoID: number;
  nombre: string;
  sku?: string | null;
};

type MovimientoInventarioDto = {
  movimientoID: number;
  fechaMovimiento: string;
  tipoMovimiento: string;
  productoNombre: string;
  sku?: string | null;
  bodegaNombre: string;
  cantidad: number;
  saldoAnterior?: number | null;
  saldoNuevo?: number | null;
  motivo?: string | null;
  referenciaTipo?: string | null;
  usuarioID?: number | null;
  usuarioNombre?: string | null;
};

type HistorialResponse = {
  items: MovimientoInventarioDto[];
  total: number;
};

type TipoFiltroValue = "" | "Entrada" | "Salida";
type TipoVisual = "Entrada" | "Salida" | "Otro";

const TIPO_OPCIONES: { value: TipoFiltroValue; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "Entrada", label: "Entradas" },
  { value: "Salida", label: "Salidas" },
];

function formatFechaHoraCostaRica(value: string | undefined | null): string {
  if (!value) return "—";

  const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
  const parsed = new Date(hasTimezone ? value : value.replace(" ", "T"));

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("es-CR", {
    timeZone: "America/Costa_Rica",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizarTipoMovimiento(tipoRaw: string | null | undefined): TipoVisual {
  const tipo = normalizeText(tipoRaw);

  if (!tipo) return "Otro";

  const esEntrada =
    tipo === "entrada" ||
    tipo === "ajustemanualentrada" ||
    tipo === "ajusteentrada" ||
    tipo === "entradaajuste" ||
    tipo.includes("entrada");

  const esSalida =
    tipo === "salida" ||
    tipo === "ajustesalidamanual" ||
    tipo === "ajustemanualsalida" ||
    tipo === "salidaporventa" ||
    tipo === "salidaventa" ||
    tipo === "venta" ||
    tipo === "ventasalida" ||
    tipo === "salida_venta" ||
    tipo === "venta_salida" ||
    tipo.includes("salida") ||
    tipo.includes("venta");

  if (esEntrada && !esSalida) return "Entrada";
  if (esSalida) return "Salida";

  return "Otro";
}

function formatNumberCR(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toLocaleString("es-CR");
}

export default function HistorialInventarioPage() {
  const { call } = useApi();

  const [initialBodegaIdFromQuery, setInitialBodegaIdFromQuery] = useState<
    number | ""
  >("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const value = params.get("bodegaId");
    const parsed = value ? Number(value) : NaN;

    setInitialBodegaIdFromQuery(
      Number.isInteger(parsed) && parsed > 0 ? parsed : ""
    );
  }, []);

  const [bodegas, setBodegas] = useState<BodegaOption[]>([]);
  const [loadingBodegas, setLoadingBodegas] = useState(false);

  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  const [filtros, setFiltros] = useState<{
    bodegaID: number | "";
    productoID: number | "";
    tipo: TipoFiltroValue;
    fechaDesde: string;
    fechaHasta: string;
  }>({
    bodegaID: "",
    productoID: "",
    tipo: "",
    fechaDesde: "",
    fechaHasta: "",
  });

  useEffect(() => {
    setFiltros((f) => ({ ...f, bodegaID: initialBodegaIdFromQuery }));
  }, [initialBodegaIdFromQuery]);

  const [data, setData] = useState<MovimientoInventarioDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedMotivos, setExpandedMotivos] = useState<Record<number, boolean>>(
    {}
  );

  const loadBodegas = useCallback(async () => {
    setLoadingBodegas(true);

    try {
      const page = await call<{ items: BodegaOption[]; total: number }>(
        "/api/bodegas?soloActivas=true&page=1&pageSize=1000",
        { method: "GET" }
      );

      const items = (page as { items?: BodegaOption[] })?.items ?? [];
      setBodegas(Array.isArray(items) ? items : []);
    } catch {
      setBodegas([]);
    } finally {
      setLoadingBodegas(false);
    }
  }, [call]);

  const loadProductos = useCallback(async () => {
    setLoadingProductos(true);

    try {
      const rows = await call<ProductoOption[]>(
        "/api/productos/mini?estado=activos",
        { method: "GET" }
      );

      setProductos(Array.isArray(rows) ? rows : []);
    } catch {
      setProductos([]);
    } finally {
      setLoadingProductos(false);
    }
  }, [call]);

  const loadHistorial = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (
        filtros.fechaDesde &&
        filtros.fechaHasta &&
        filtros.fechaDesde > filtros.fechaHasta
      ) {
        throw new Error("La fecha “Desde” no puede ser mayor que la fecha “Hasta”.");
      }

      const params = new URLSearchParams();

      if (filtros.bodegaID) params.set("bodegaId", String(filtros.bodegaID));
      if (filtros.productoID) params.set("productoId", String(filtros.productoID));
      if (filtros.fechaDesde) params.set("desde", filtros.fechaDesde);
      if (filtros.fechaHasta) params.set("hasta", filtros.fechaHasta);
      params.set("page", "1");
      params.set("pageSize", "100");

      const res = await call<HistorialResponse>(
        `/api/inventario/historial?${params.toString()}`,
        { method: "GET" }
      );

      const items = Array.isArray(res?.items) ? res.items : [];
      setData(items);
      setExpandedMotivos({});
    } catch (e: unknown) {
      setError(
        getErrorMessage(e, "No se pudo cargar el historial de inventario.")
      );
      setData([]);
      setExpandedMotivos({});
    } finally {
      setLoading(false);
    }
  }, [call, filtros]);

  useEffect(() => {
    loadBodegas().catch(() => {});
    loadProductos().catch(() => {});
  }, [loadBodegas, loadProductos]);

  useEffect(() => {
    loadHistorial().catch(() => {});
  }, [loadHistorial]);

  const selectedBodega = useMemo(
    () =>
      bodegas.find(
        (b) => filtros.bodegaID !== "" && b.bodegaID === filtros.bodegaID
      ),
    [bodegas, filtros.bodegaID]
  );

  const selectedProducto = useMemo(
    () =>
      productos.find(
        (p) => filtros.productoID !== "" && p.productoID === filtros.productoID
      ),
    [productos, filtros.productoID]
  );

  const filteredData = useMemo(() => {
    return data.filter((m) => {
      const tipoNormalizado = normalizarTipoMovimiento(m.tipoMovimiento);

      if (filtros.tipo === "") {
        return tipoNormalizado === "Entrada" || tipoNormalizado === "Salida";
      }

      return tipoNormalizado === filtros.tipo;
    });
  }, [data, filtros.tipo]);

  const totalVisible = filteredData.length;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <SectionHeader
        title="Historial de movimientos"
        subtitle={
          selectedBodega
            ? `Entradas y salidas para la bodega “${selectedBodega.nombre}”`
            : "Consulta entradas y salidas de inventario por bodega, producto y rango de fechas."
        }
      />

      <div className="mb-6 rounded-3xl border border-white/10 bg-[#121618]/90 p-4 shadow-[0_14px_40px_rgba(0,0,0,.22)] md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">
              Bodega
            </label>
            <select
              value={filtros.bodegaID === "" ? "" : Number(filtros.bodegaID)}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  bodegaID: e.target.value ? Number(e.target.value) : "",
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
            >
              <option value="">
                {loadingBodegas ? "Cargando bodegas…" : "Todas las bodegas"}
              </option>
              {bodegas.map((b) => (
                <option key={b.bodegaID} value={b.bodegaID}>
                  {b.nombre} {b.codigo ? `(${b.codigo})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">
              Producto
            </label>
            <select
              value={filtros.productoID === "" ? "" : Number(filtros.productoID)}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  productoID: e.target.value ? Number(e.target.value) : "",
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
            >
              <option value="">
                {loadingProductos ? "Cargando productos…" : "Todos los productos"}
              </option>
              {productos.map((p) => (
                <option key={p.productoID} value={p.productoID}>
                  {p.nombre}
                  {p.sku ? ` — SKU: ${p.sku}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">
              Tipo de movimiento
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  tipo: e.target.value as TipoFiltroValue,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
            >
              {TIPO_OPCIONES.map((t) => (
                <option key={t.value || "all"} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">
              Desde
            </label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  fechaDesde: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">
              Hasta
            </label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  fechaHasta: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => loadHistorial()}
              disabled={loading}
              className="flex-1 rounded-xl bg-[#A30862] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Buscando…" : "Aplicar filtros"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFiltros({
                  bodegaID: initialBodegaIdFromQuery,
                  productoID: "",
                  tipo: "",
                  fechaDesde: "",
                  fechaHasta: "",
                });
                setExpandedMotivos({});
                setError(null);
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-medium text-white transition hover:bg-white/10"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-[#121618]/90 shadow-[0_16px_45px_rgba(0,0,0,.22)]">
        <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-3 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Resultados:{" "}
            <span className="font-semibold text-white">{totalVisible}</span>
          </span>

          {selectedProducto && (
            <span className="break-words text-[11px] text-white/60">
              Producto: <span className="text-white">{selectedProducto.nombre}</span>
              {selectedProducto.sku && ` — SKU: ${selectedProducto.sku}`}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1320px] w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-[#1C2224] text-left text-xs uppercase tracking-wide text-white/70">
                <th className="min-w-[150px] px-4 py-3">Fecha</th>
                <th className="min-w-[120px] px-4 py-3">Tipo</th>
                <th className="min-w-[170px] px-4 py-3">Producto</th>
                <th className="min-w-[160px] px-4 py-3">Bodega</th>
                <th className="min-w-[110px] px-4 py-3 text-right">Cantidad</th>
                <th className="min-w-[220px] px-4 py-3">Saldo</th>
                <th className="min-w-[280px] px-4 py-3">Motivo / Ref.</th>
                <th className="min-w-[180px] px-4 py-3">Usuario</th>
              </tr>
            </thead>

            <tbody className="[&>tr]:border-white/10">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-5 text-center text-sm text-white/70">
                    Cargando historial…
                  </td>
                </tr>
              )}

              {!loading && filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-5 text-center text-sm text-white/70">
                    No hay movimientos que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredData.map((m, idx) => {
                  const fechaStr = formatFechaHoraCostaRica(m.fechaMovimiento);
                  const tipoNormalizado = normalizarTipoMovimiento(m.tipoMovimiento);
                  const isEntrada = tipoNormalizado === "Entrada";
                  const isSalida = tipoNormalizado === "Salida";
                  const tipoLabel = tipoNormalizado === "Otro" ? "—" : tipoNormalizado;

                  const chipClass = isEntrada
                    ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                    : isSalida
                    ? "border border-rose-400/30 bg-rose-500/15 text-rose-200"
                    : "border border-amber-400/30 bg-amber-500/15 text-amber-100";

                  const cantidadTexto =
                    typeof m.cantidad === "number"
                      ? `${isEntrada ? "+" : isSalida ? "-" : ""}${m.cantidad.toLocaleString("es-CR")}`
                      : "—";

                  const cantidadClass = isEntrada
                    ? "text-emerald-300"
                    : isSalida
                    ? "text-rose-300"
                    : "text-white";

                  const motivoMaxLen = 90;
                  const lenMotivo = m.motivo?.length ?? 0;
                  const isLongMotivo = lenMotivo > motivoMaxLen;
                  const expanded = !!expandedMotivos[m.movimientoID];
                  const motivoPreview =
                    !m.motivo || !isLongMotivo
                      ? m.motivo ?? ""
                      : m.motivo.slice(0, motivoMaxLen) + "…";

                  const saldoAnterior = formatNumberCR(m.saldoAnterior);
                  const saldoNuevo = formatNumberCR(m.saldoNuevo);

                  return (
                    <tr
                      key={m.movimientoID ?? `${m.fechaMovimiento}-${idx}`}
                      className={`transition ${
                        idx % 2 === 0 ? "bg-white/[.02]" : "bg-transparent"
                      } hover:bg-white/[.04]`}
                    >
                      <td className="px-4 py-3 align-top text-xs text-white/80 md:text-sm">
                        <div className="break-words whitespace-normal leading-6">
                          {fechaStr}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-xs md:text-sm">
                        <span
                          className={[
                            "inline-flex min-w-[110px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium",
                            chipClass,
                          ].join(" ")}
                        >
                          {tipoLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-top text-xs md:text-sm">
                        <div className="break-words font-medium text-white">
                          {m.productoNombre}
                        </div>
                        <div className="mt-1 break-words text-[11px] text-white/60">
                          {m.sku ? `SKU: ${m.sku}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-xs text-white/80 md:text-sm">
                        <div className="break-words whitespace-normal">
                          {m.bodegaNombre}
                        </div>
                      </td>

                      <td
                        className={`px-4 py-3 align-top text-right text-xs font-semibold md:text-sm ${cantidadClass}`}
                      >
                        {cantidadTexto}
                      </td>

                      <td className="px-4 py-3 align-top text-xs md:text-sm">
                        <div className="min-w-[190px] rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] text-white/55">Anterior</span>
                            <span className="text-sm text-white/80">{saldoAnterior}</span>
                          </div>

                          <div className="my-2 h-px bg-white/10" />

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] text-white/55">Nuevo</span>
                            <span className="text-sm font-semibold text-white">
                              {saldoNuevo}
                            </span>
                          </div>

                          <div className="mt-2">
                            <span
                              className={[
                                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                                isEntrada
                                  ? "bg-emerald-500/15 text-emerald-200"
                                  : isSalida
                                  ? "bg-rose-500/15 text-rose-200"
                                  : "bg-white/10 text-white/70",
                              ].join(" ")}
                            >
                              {isEntrada
                                ? "Stock incrementado"
                                : isSalida
                                ? "Stock reducido"
                                : "Movimiento"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-xs text-white/80 md:text-sm">
                        <div className="w-[260px] max-w-[260px] rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          {m.motivo ? (
                            <>
                              <div
                                className={[
                                  "break-words whitespace-pre-wrap text-white/80",
                                  expanded ? "max-h-32 overflow-y-auto pr-1" : "max-h-[48px] overflow-hidden",
                                ].join(" ")}
                              >
                                {expanded ? m.motivo : motivoPreview}
                              </div>

                              {isLongMotivo && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedMotivos((prev) => ({
                                      ...prev,
                                      [m.movimientoID]: !expanded,
                                    }))
                                  }
                                  className="mt-2 text-[11px] font-medium text-[#A30862] hover:underline"
                                >
                                  {expanded ? "Cerrar" : "Ver más"}
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-white/40">—</span>
                          )}

                          {m.referenciaTipo && (
                            <div className="mt-2 border-t border-white/10 pt-2 break-words text-[11px] text-white/55">
                              Ref: {m.referenciaTipo}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-xs text-white/80 md:text-sm">
                        <div className="break-words whitespace-normal">
                          {m.usuarioNombre
                            ? m.usuarioNombre
                            : m.usuarioID
                            ? `#${m.usuarioID}`
                            : "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}