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

type TipoFiltroValue = "" | "Entrada" | "Salida" | "AjusteSalidaManual";

const TIPO_OPCIONES: { value: TipoFiltroValue; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "Entrada", label: "Entradas" },
  { value: "Salida", label: "Salidas" },
  { value: "AjusteSalidaManual", label: "Ajustes manuales" },
];

function formatFechaHoraCostaRica(iso: string | undefined | null): string {
  if (!iso) return "—";
  const normalized = iso.endsWith("Z") ? iso : iso + "Z";
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CR", {
    timeZone: "America/Costa_Rica",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistorialInventarioPage() {
  const { call } = useApi();

  const [initialBodegaIdFromQuery, setInitialBodegaIdFromQuery] = useState<
    number | ""
  >("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const v = params.get("bodegaId");
    setInitialBodegaIdFromQuery(v ? Number(v) || "" : "");
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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedMotivos, setExpandedMotivos] = useState<
    Record<number, boolean>
  >({});

  const loadBodegas = useCallback(async () => {
    setLoadingBodegas(true);
    try {
      const page = await call<{ items: BodegaOption[]; total: number }>(
        "/api/bodegas?soloActivas=true&page=1&pageSize=1000",
        { method: "GET" }
      );
      const items = (page as any)?.items ?? page ?? [];
      setBodegas(items);
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
      setProductos(rows ?? []);
    } finally {
      setLoadingProductos(false);
    }
  }, [call]);

  const loadHistorial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.bodegaID) params.set("bodegaId", String(filtros.bodegaID));
      if (filtros.productoID)
        params.set("productoId", String(filtros.productoID));
      if (filtros.tipo) params.set("tipoMovimiento", filtros.tipo);
      if (filtros.fechaDesde) params.set("desde", filtros.fechaDesde);
      if (filtros.fechaHasta) params.set("hasta", filtros.fechaHasta);
      params.set("page", "1");
      params.set("pageSize", "100");

      const res = await call<HistorialResponse>(
        `/api/inventario/historial?${params.toString()}`,
        { method: "GET" }
      );

      const items = (res as any)?.items ?? res ?? [];
      setData(items);
      setTotal((res as any)?.total ?? items.length ?? 0);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar el historial de inventario.");
      setData([]);
      setTotal(0);
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
        (b) => filtros.bodegaID && b.bodegaID === filtros.bodegaID
      ),
    [bodegas, filtros.bodegaID]
  );

  const selectedProducto = useMemo(
    () =>
      productos.find(
        (p) => filtros.productoID && p.productoID === filtros.productoID
      ),
    [productos, filtros.productoID]
  );

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader
        title="Historial de movimientos"
        subtitle={
          selectedBodega
            ? `Entradas, salidas y ajustes para la bodega “${selectedBodega.nombre}”`
            : "Consulta los movimientos de inventario por bodega, producto y rango de fechas."
        }
      />

      <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-white/70">Bodega</label>
            <select
              value={filtros.bodegaID === "" ? "" : Number(filtros.bodegaID)}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  bodegaID: e.target.value ? Number(e.target.value) : "",
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
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
            <label className="mb-1 block text-xs text-white/70">Producto</label>
            <select
              value={
                filtros.productoID === "" ? "" : Number(filtros.productoID)
              }
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  productoID: e.target.value ? Number(e.target.value) : "",
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
            >
              <option value="">
                {loadingProductos
                  ? "Cargando productos…"
                  : "Todos los productos"}
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
            <label className="mb-1 block text-xs text-white/70">
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
              className="w-full rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
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
            <label className="mb-1 block text-xs text-white/70">Desde</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  fechaDesde: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/70">Hasta</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  fechaHasta: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
            />
          </div>

          <div className="flex items:end gap-2 items-end">
            <button
              onClick={() => loadHistorial()}
              disabled={loading}
              className="flex-1 rounded-xl bg-[#A30862] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-white/70">
          <span>
            Resultados:{" "}
            <span className="font-semibold text-white">{total}</span>
          </span>
          {selectedProducto && (
            <span className="text-[11px] text-white/60">
              Producto:{" "}
              <span className="text-white">{selectedProducto.nombre}</span>
              {selectedProducto.sku && ` — SKU: ${selectedProducto.sku}`}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-[#1C2224] text-left text-xs uppercase tracking-wide text-white/70">
                <th className="px-4 py-2.5">Fecha</th>
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5">Producto</th>
                <th className="px-4 py-2.5">Bodega</th>
                <th className="px-4 py-2.5 text-right">Cantidad</th>
                <th className="px-4 py-2.5 text-right">Saldo</th>
                <th className="px-4 py-2.5">Motivo / Ref.</th>
                <th className="px-4 py-2.5">Usuario</th>
              </tr>
            </thead>
            <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-4 text-center text-sm text-white/70"
                  >
                    Cargando historial…
                  </td>
                </tr>
              )}

              {!loading && data.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-4 text-center text-sm text-white/70"
                  >
                    No hay movimientos que coincidan con los filtros
                    seleccionados.
                  </td>
                </tr>
              )}

              {!loading &&
                data.map((m, idx) => {
                  const fechaStr = formatFechaHoraCostaRica(
                    m.fechaMovimiento
                  );

                  const tipoRaw = m.tipoMovimiento;

                  let tipoLabel: string;
                  if (
                    tipoRaw === "AjusteSalidaManual" ||
                    tipoRaw === "AjusteManualEntrada" ||
                    tipoRaw === "AjusteManualSalida"
                  ) {
                    tipoLabel = "Ajuste manual";
                  } else if (tipoRaw === "Entrada") {
                    tipoLabel = "Entrada";
                  } else if (tipoRaw === "Salida") {
                    tipoLabel = "Salida";
                  } else {
                    tipoLabel = tipoRaw ?? "—";
                  }

                  const isEntrada =
                    tipoRaw === "Entrada" || tipoRaw === "AjusteManualEntrada";
                  const isSalida =
                    tipoRaw === "Salida" ||
                    tipoRaw === "AjusteSalidaManual" ||
                    tipoRaw === "AjusteManualSalida";

                  const chipClass = isEntrada
                    ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30"
                    : isSalida
                    ? "bg-rose-500/15 text-rose-200 border border-rose-400/30"
                    : "bg-amber-500/15 text-amber-100 border border-amber-400/30";

                  const saldoTexto =
                    m.saldoAnterior != null && m.saldoNuevo != null
                      ? `${m.saldoAnterior.toLocaleString(
                          "es-CR"
                        )} → ${m.saldoNuevo.toLocaleString("es-CR")}`
                      : m.saldoNuevo != null
                      ? m.saldoNuevo.toLocaleString("es-CR")
                      : "—";

                  const motivoMaxLen = 80;
                  const lenMotivo = m.motivo?.length ?? 0;
                  const isLongMotivo = lenMotivo > motivoMaxLen;
                  const expanded = !!expandedMotivos[m.movimientoID];
                  const motivoPreview =
                    !m.motivo || !isLongMotivo
                      ? m.motivo ?? ""
                      : m.motivo.slice(0, motivoMaxLen) + "…";

                  return (
                    <tr
                      key={m.movimientoID ?? `${m.fechaMovimiento}-${idx}`}
                      className={
                        idx % 2 === 0 ? "bg-white/[.02]" : "bg-transparent"
                      }
                    >
                      <td className="px-4 py-2.5 align-top text-xs md:text-sm text-white/80">
                        {fechaStr}
                      </td>

                      <td className="px-4 py-2.5 align-top text-xs md:text-sm">
                        <span
                          className={[
                            "inline-flex min-w-[110px] justify-center items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                            chipClass,
                          ].join(" ")}
                        >
                          {tipoLabel}
                        </span>
                      </td>

                      <td className="px-4 py-2.5 align-top text-xs md:text-sm">
                        <div className="text-white">{m.productoNombre}</div>
                        <div className="text-[11px] text-white/60">
                          {m.sku ? `SKU: ${m.sku}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-top text-xs md:text-sm text-white/80">
                        {m.bodegaNombre}
                      </td>
                      <td className="px-4 py-2.5 align-top text-xs md:text-sm text-right">
                        {m.cantidad?.toLocaleString("es-CR") ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 align-top text-xs md:text-sm text-right">
                        {saldoTexto}
                      </td>

                      <td className="relative px-4 py-2.5 align-top text-xs md:text-sm text-white/80">
                        {m.motivo && (
                          <div className="flex w-[260px] items-start gap-1">
                            <span className="truncate text-white/80">
                              {motivoPreview}
                            </span>

                            {isLongMotivo && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedMotivos((prev) => ({
                                    ...prev,
                                    [m.movimientoID]: !expanded,
                                  }))
                                }
                                className="shrink-0 text-[11px] text-[#A30862] hover:underline"
                              >
                                {expanded ? "Cerrar" : "Ver más"}
                              </button>
                            )}
                          </div>
                        )}

                        {m.referenciaTipo && (
                          <div className="mt-0.5 text-[11px] text-white/60">
                            Ref: {m.referenciaTipo}
                          </div>
                        )}

                        {expanded && m.motivo && (
                          <div className="absolute left-4 top-full z-20 mt-2 w-80 max-w-xs rounded-xl border border-white/20 bg-[#111827] p-3 text-[13px] text-white shadow-xl">
                            <div className="mb-1 text-[11px] font-semibold uppercase text-white/60">
                              Motivo completo
                            </div>
                            <p className="whitespace-pre-wrap break-words">
                              {m.motivo}
                            </p>
                            <div className="mt-2 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedMotivos((prev) => ({
                                    ...prev,
                                    [m.movimientoID]: false,
                                  }))
                                }
                                className="text-[11px] text-[#A30862] hover:underline"
                              >
                                Cerrar
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-2.5 align-top text-xs md:text-sm text-white/80">
                        {m.usuarioNombre
                          ? m.usuarioNombre
                          : m.usuarioID
                          ? `#${m.usuarioID}`
                          : "—"}
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
