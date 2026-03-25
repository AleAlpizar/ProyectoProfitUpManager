"use client";

import React from "react";
import useSWR from "swr";
import {
  Area as RechartsArea,
  AreaChart as RechartsAreaChart,
  CartesianGrid as RechartsCartesianGrid,
  ResponsiveContainer as RechartsResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
} from "recharts";

const Area: any = RechartsArea;
const AreaChart: any = RechartsAreaChart;
const CartesianGrid: any = RechartsCartesianGrid;
const ResponsiveContainer: any = RechartsResponsiveContainer;
const Tooltip: any = RechartsTooltip;
const XAxis: any = RechartsXAxis;
const YAxis: any = RechartsYAxis;

type VentasDia = {
  fecha: string;
  cantidadVentas: number;
  montoTotal: number;
  ticketPromedio: number;
};

type VentasMes = {
  anio: number;
  mes: number;
  cantidadVentas: number;
  montoTotal: number;
  ticketPromedio: number;
};

type VentasTopProducto = {
  productoID: number;
  sku: string;
  nombre: string;
  cantidadVendida: number;
  montoVendido: number;
  margenBruto: number;
};

type ProductoSinMovimiento = {
  productoID: number;
  sku: string;
  nombre: string;
};

type VentasPorBodega = {
  bodegaID: number;
  nombreBodega: string;
  cantidadVendida: number;
  montoVendido: number;
};

type RotacionInventario = {
  productoID: number;
  sku: string;
  nombre: string;
  cantidadVendida: number;
  stockActual: number;
  indiceRotacion: number;
};

type VentaStockIssue = {
  productoID: number;
  bodegaID: number;
  sku: string;
  nombreProducto: string;
  stockActual: number;
  cantidadVendidaPeriodo: number;
  indiceCriticidad: number;
};

type AnulacionPorUsuario = {
  usuarioID: number;
  cantidadAnulaciones: number;
  montoTotalAnulado: number;
};

type AnulacionDetalle = {
  anulacionID: number;
  ventaID: number;
  fechaAnulacion: string;
  motivo: string | null;
  usuarioID: number | null;
  totalVenta: number;
};

type VentasDashboardDto = {
  fechaDesde: string | null;
  fechaHasta: string | null;
  totalVentas: number;
  montoTotal: number;
  ticketPromedioGlobal: number;
  porDia: VentasDia[];
  porMes: VentasMes[];
  topProductos: VentasTopProducto[];
  productosSinMovimiento: ProductoSinMovimiento[];
  ventasPorBodega: VentasPorBodega[];
  rotacionInventario: RotacionInventario[];
  posiblesProblemasStock: VentaStockIssue[];
  anulacionesPorUsuario: AnulacionPorUsuario[];
  anulacionesDetalle: AnulacionDetalle[];
};

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5151";

const formatCurrency = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  });

const formatNumber = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString("es-CR");

const formatShortDate = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatMonthLabel = (anio: number, mes: number) => {
  const d = new Date(anio, mes - 1, 1);
  return d.toLocaleDateString("es-CR", {
    month: "short",
    year: "numeric",
  });
};

const toLocalInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const pillClass = (active: boolean) =>
  [
    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
    active
      ? "border-[#E35CA0] bg-[#B01268] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]",
  ].join(" ");

const dateInputClass =
  "h-9 rounded-full border border-white/10 bg-black/30 px-3 text-xs text-slate-200 transition focus:outline-none focus:ring-1 focus:ring-[#B01268] focus:border-[#B01268]";

const panelClass =
  "rounded-2xl border border-white/10 bg-gradient-to-b from-[#120010] to-[#020617] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]";

const softCardClass =
  "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm";

const listItemClass =
  "rounded-xl border border-white/5 bg-white/[0.04] px-3 py-3 transition hover:bg-white/[0.06]";

const fetcher = async (relativeUrl: string): Promise<VentasDashboardDto> => {
  const res = await fetch(`${apiBase}${relativeUrl}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `HTTP_${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // sin acción
    }
    throw new Error(message);
  }

  return res.json();
};

export function VentasDashboardFragment() {
  const [range, setRange] = React.useState<
    "30d" | "90d" | "year" | "all" | "custom"
  >("30d");
  const [topSort, setTopSort] = React.useState<"monto" | "cantidad">("monto");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [customError, setCustomError] = React.useState("");

  const applyCustomRange = () => {
    if (!fromDate && !toDate) {
      setCustomError("Selecciona al menos una fecha para aplicar el filtro.");
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      setCustomError("La fecha inicial no puede ser mayor que la fecha final.");
      return;
    }

    setCustomError("");
    setRange("custom");
  };

  const apiUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined;

    if (range === "30d") {
      to = today;
      from = new Date(today);
      from.setDate(today.getDate() - 29);
    } else if (range === "90d") {
      to = today;
      from = new Date(today);
      from.setDate(today.getDate() - 89);
    } else if (range === "year") {
      to = today;
      from = new Date(today.getFullYear(), 0, 1);
    } else if (range === "all") {
      from = undefined;
      to = undefined;
    } else if (range === "custom") {
      if (fromDate) params.set("fechaDesde", fromDate);
      if (toDate) params.set("fechaHasta", toDate);
    }

    if (range !== "custom") {
      if (from) params.set("fechaDesde", toLocalInputDate(from));
      if (to) params.set("fechaHasta", toLocalInputDate(to));
    }

    const qs = params.toString();
    return `/api/reportes/ventas/dashboard${qs ? `?${qs}` : ""}`;
  }, [range, fromDate, toDate]);

  const { data, error, isLoading } = useSWR<VentasDashboardDto>(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const chartData = React.useMemo(() => {
    if (!data?.porDia) return [];
    return data.porDia.map((d) => ({
      fecha: d.fecha,
      label: formatShortDate(d.fecha),
      cantidadVentas: d.cantidadVentas,
      montoTotal: Number(d.montoTotal ?? 0),
      ticketPromedio: Number(d.ticketPromedio ?? 0),
    }));
  }, [data]);

  const sortedTopProductos = React.useMemo(() => {
    if (!data?.topProductos) return [];
    const list = [...data.topProductos];

    if (topSort === "monto") {
      list.sort(
        (a, b) => Number(b.montoVendido ?? 0) - Number(a.montoVendido ?? 0)
      );
    } else {
      list.sort(
        (a, b) =>
          Number(b.cantidadVendida ?? 0) - Number(a.cantidadVendida ?? 0)
      );
    }

    return list.slice(0, 20);
  }, [data, topSort]);

  const productosSinMovimiento = data?.productosSinMovimiento ?? [];
  const ventasPorBodega = data?.ventasPorBodega ?? [];
  const rotacionInventario = data?.rotacionInventario ?? [];
  const posiblesProblemasStock = data?.posiblesProblemasStock ?? [];
  const anulacionesPorUsuario = data?.anulacionesPorUsuario ?? [];
  const anulacionesDetalle = data?.anulacionesDetalle ?? [];
  const porMes = data?.porMes ?? [];

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/50 to-red-900/20 p-5 shadow-sm">
        <p className="text-sm font-semibold text-red-200">
          No se pudo cargar el reporte de ventas
        </p>
        <p className="mt-1 text-sm text-red-100/80">
          {error.message || "Ocurrió un error inesperado."}
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0A0D14] to-[#05070A] p-8 text-sm text-slate-300 shadow-sm">
        Cargando panel de ventas…
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className={`${panelClass} overflow-hidden`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex rounded-full border border-[#B01268]/30 bg-[#B01268]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#F6A5DA]">
              Reportería
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
              Panel de ventas
            </h1>
            {data.fechaDesde && data.fechaHasta && (
              <p className="text-sm text-slate-400">
                Rango consultado:{" "}
                <span className="font-medium text-slate-200">
                  {formatShortDate(data.fechaDesde)}
                </span>{" "}
                —{" "}
                <span className="font-medium text-slate-200">
                  {formatShortDate(data.fechaHasta)}
                </span>
              </p>
            )}
          </div>

          <div className="flex max-w-full flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pillClass(range === "30d")}
                onClick={() => {
                  setCustomError("");
                  setRange("30d");
                }}
              >
                Últimos 30 días
              </button>
              <button
                type="button"
                className={pillClass(range === "90d")}
                onClick={() => {
                  setCustomError("");
                  setRange("90d");
                }}
              >
                Últimos 90 días
              </button>
              <button
                type="button"
                className={pillClass(range === "year")}
                onClick={() => {
                  setCustomError("");
                  setRange("year");
                }}
              >
                Este año
              </button>
              <button
                type="button"
                className={pillClass(range === "all")}
                onClick={() => {
                  setCustomError("");
                  setRange("all");
                }}
              >
                Todo
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                className={dateInputClass}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span className="text-xs text-slate-500">a</span>
              <input
                type="date"
                className={dateInputClass}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <button
                type="button"
                className="h-9 rounded-full bg-[#B01268] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#C81D76]"
                onClick={applyCustomRange}
              >
                Aplicar
              </button>
            </div>

            {customError && (
              <p className="text-xs font-medium text-red-300">{customError}</p>
            )}
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1A0620] via-[#130118] to-[#04101D] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Ventas registradas
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
            {formatNumber(data.totalVentas)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1A0620] via-[#130118] to-[#04101D] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Monto total vendido
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#F6A5DA]">
            {formatCurrency(data.montoTotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1A0620] via-[#130118] to-[#04101D] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Ticket promedio
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#FBCFE8]">
            {formatCurrency(data.ticketPromedioGlobal)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr,1.2fr]">
        <div className={panelClass}>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-slate-100">
              Ventas por día
            </h2>
            <span className="text-xs text-slate-400">
              Monto total por fecha
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="ventasArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#B01268" stopOpacity={0.9} />
                    <stop offset="90%" stopColor="#4B0430" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#475569"
                  strokeOpacity={0.22}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{
                    stroke: "#B01268",
                    strokeWidth: 1,
                    strokeDasharray: "4 2",
                  }}
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;

                    const item = payload[0].payload as {
                      label: string;
                      cantidadVentas: number;
                      montoTotal: number;
                      ticketPromedio: number;
                    };

                    return (
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
                        <div className="text-xs font-semibold text-slate-700">
                          {item.label}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Ventas: {formatNumber(item.cantidadVentas)}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Ticket promedio: {formatCurrency(item.ticketPromedio)}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[#9F1239]">
                          Monto total: {formatCurrency(item.montoTotal)}
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="montoTotal"
                  stroke="#B01268"
                  strokeWidth={2.5}
                  fill="url(#ventasArea)"
                  dot={{
                    r: 3,
                    strokeWidth: 1,
                    stroke: "#F9FAFB",
                    fill: "#6B0F46",
                  }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={panelClass}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-slate-100">
              Top productos vendidos
            </h2>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Ordenar por:</span>
              <select
                className="h-9 rounded-full border border-white/10 bg-black/30 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#B01268]"
                value={topSort}
                onChange={(e) =>
                  setTopSort(e.target.value as "monto" | "cantidad")
                }
              >
                <option value="monto">Monto vendido</option>
                <option value="cantidad">Cantidad vendida</option>
              </select>
            </div>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {sortedTopProductos.length === 0 ? (
              <div className={`${softCardClass} px-4 py-4 text-sm text-slate-400`}>
                No hay productos vendidos en el rango seleccionado.
              </div>
            ) : (
              sortedTopProductos.map((p, idx) => (
                <div key={p.productoID} className={listItemClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4B0430] text-[11px] font-semibold text-[#FCE7F3]">
                        {idx + 1}
                      </span>

                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          {p.nombre || "(Producto)"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {p.sku || "Sin SKU"}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          Cantidad:{" "}
                          <span className="font-semibold text-slate-200">
                            {formatNumber(p.cantidadVendida)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Monto vendido</p>
                      <p className="mt-1 text-sm font-semibold text-[#F9A8D4]">
                        {formatCurrency(p.montoVendido)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={panelClass}>
          <h2 className="mb-4 text-base font-semibold text-slate-100">
            Rendimiento por mes
          </h2>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {porMes.length === 0 ? (
              <div className={`${softCardClass} px-4 py-4 text-sm text-slate-400`}>
                No hay datos mensuales para el rango seleccionado.
              </div>
            ) : (
              porMes.map((m) => (
                <div key={`${m.anio}-${m.mes}`} className={listItemClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {formatMonthLabel(m.anio, m.mes)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Ventas:{" "}
                        <span className="font-semibold text-slate-200">
                          {formatNumber(m.cantidadVentas)}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Monto</p>
                      <p className="mt-1 text-sm font-semibold text-[#F9A8D4]">
                        {formatCurrency(m.montoTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={panelClass}>
          <h2 className="mb-4 text-base font-semibold text-slate-100">
            Ventas por bodega
          </h2>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {ventasPorBodega.length === 0 ? (
              <div className={`${softCardClass} px-4 py-4 text-sm text-slate-400`}>
                No hay ventas registradas por bodega en el rango.
              </div>
            ) : (
              ventasPorBodega.map((b) => (
                <div key={b.bodegaID} className={listItemClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {b.nombreBodega}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Cantidad vendida:{" "}
                        <span className="font-semibold text-slate-200">
                          {formatNumber(b.cantidadVendida)}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Monto vendido</p>
                      <p className="mt-1 text-sm font-semibold text-[#F9A8D4]">
                        {formatCurrency(b.montoVendido)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={panelClass}>
          <h2 className="mb-4 text-base font-semibold text-slate-100">
            Productos sin movimiento
          </h2>

          <div className="max-h-80 overflow-y-auto pr-1">
            {productosSinMovimiento.length === 0 ? (
              <div className={`${softCardClass} px-4 py-4 text-sm text-slate-400`}>
                Todos los productos tuvieron al menos una venta en el periodo.
              </div>
            ) : (
              <ul className="space-y-2">
                {productosSinMovimiento.map((p) => (
                  <li key={p.productoID} className={listItemClass}>
                    <p className="text-sm font-medium text-slate-100">
                      {p.nombre}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {p.sku || "Sin SKU"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={panelClass}>
          <h2 className="mb-4 text-base font-semibold text-slate-100">
            Rotación de inventario
          </h2>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {rotacionInventario.length === 0 ? (
              <div className={`${softCardClass} px-4 py-4 text-sm text-slate-400`}>
                No hay datos de rotación en el periodo seleccionado.
              </div>
            ) : (
              rotacionInventario.map((r) => (
                <div key={r.productoID} className={listItemClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {r.nombre}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {r.sku || "Sin SKU"} · Vendido:{" "}
                        <span className="font-semibold text-slate-200">
                          {formatNumber(r.cantidadVendida)}
                        </span>{" "}
                        · Stock:{" "}
                        <span className="font-semibold text-slate-200">
                          {formatNumber(r.stockActual)}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Índice</p>
                      <p className="mt-1 text-sm font-semibold text-[#F9A8D4]">
                        {formatNumber(r.indiceRotacion)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={panelClass}>
          <h2 className="mb-4 text-base font-semibold text-slate-100">
            Posibles problemas de stock
          </h2>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {posiblesProblemasStock.length === 0 ? (
              <div className={`${softCardClass} px-4 py-4 text-sm text-slate-400`}>
                No se detectaron posibles problemas de stock en el periodo.
              </div>
            ) : (
              posiblesProblemasStock.map((s) => (
                <div
                  key={`${s.productoID}-${s.bodegaID}`}
                  className="rounded-xl border border-[#B01268]/40 bg-[#3B021F]/55 px-4 py-3 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-100">
                    {s.nombreProducto}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {s.sku || "Sin SKU"}
                  </p>
                  <p className="mt-2 text-xs text-slate-300">
                    {s.bodegaID === 0 ? "Stock global" : `Bodega ${s.bodegaID}`} ·
                    Vendido:{" "}
                    <span className="font-semibold text-slate-100">
                      {formatNumber(s.cantidadVendidaPeriodo)}
                    </span>{" "}
                    · Stock actual:{" "}
                    <span className="font-semibold text-slate-100">
                      {formatNumber(s.stockActual)}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-rose-200">
                    Índice de criticidad:{" "}
                    <span className="font-semibold">
                      {formatNumber(s.indiceCriticidad)}
                    </span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={panelClass}>
          <h2 className="mb-4 text-base font-semibold text-slate-100">
            Anulaciones por usuario
          </h2>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {anulacionesPorUsuario.length === 0 ? (
              <div className={`${softCardClass} px-4 py-4 text-sm text-slate-400`}>
                No hay anulaciones registradas en el rango seleccionado.
              </div>
            ) : (
              anulacionesPorUsuario.map((a) => (
                <div key={a.usuarioID} className={listItemClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        Usuario #{a.usuarioID}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Cantidad de anulaciones:{" "}
                        <span className="font-semibold text-slate-200">
                          {formatNumber(a.cantidadAnulaciones)}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Monto anulado</p>
                      <p className="mt-1 text-sm font-semibold text-[#F9A8D4]">
                        {formatCurrency(a.montoTotalAnulado)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className={panelClass}>
        <h2 className="mb-4 text-base font-semibold text-slate-100">
          Detalle de anulaciones
        </h2>

        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {anulacionesDetalle.length === 0 ? (
            <div className={`${softCardClass} px-4 py-4 text-sm text-slate-400`}>
              No hay detalle de anulaciones para mostrar en este rango.
            </div>
          ) : (
            anulacionesDetalle.map((a) => (
              <div
                key={a.anulacionID}
                className="rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.06]"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      Venta #{a.ventaID}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Anulación #{a.anulacionID} ·{" "}
                      {formatShortDate(a.fechaAnulacion)}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-[11px] text-slate-400">Total venta</p>
                    <p className="mt-1 text-sm font-semibold text-[#F9A8D4]">
                      {formatCurrency(a.totalVenta)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <p className="text-xs text-slate-300">
                    Usuario:{" "}
                    <span className="font-semibold text-slate-100">
                      {a.usuarioID ? `#${a.usuarioID}` : "No registrado"}
                    </span>
                  </p>

                  <p className="text-xs text-slate-300">
                    Motivo:{" "}
                    <span className="font-semibold text-slate-100">
                      {a.motivo?.trim() ? a.motivo : "Sin motivo registrado"}
                    </span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}