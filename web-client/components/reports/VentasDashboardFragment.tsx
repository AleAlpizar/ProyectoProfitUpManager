// @ts-nocheck
"use client";

import React from "react";
import useSWR from "swr";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type VentasDia = {
  fecha: string;
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
  porMes: any[];
  topProductos: VentasTopProducto[];
  productosSinMovimiento: ProductoSinMovimiento[];
  ventasPorBodega: VentasPorBodega[];
  rotacionInventario: RotacionInventario[];
  posiblesProblemasStock: VentaStockIssue[];
  anulacionesPorUsuario: AnulacionPorUsuario[];
  anulacionesDetalle: AnulacionDetalle[];
};

const formatCurrency = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  });

const formatNumber = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString("es-CR");

const formatShortDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit" });
};

const pillClass = (active: boolean) =>
  [
    "rounded-full px-3 py-1 text-xs border transition",
    active
      ? "bg-[#B01268] border-[#E35CA0] text-white shadow-sm"
      : "border-white/10 text-slate-300 hover:bg-white/5",
  ].join(" ");

const dateInputClass =
  "rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#B01268]";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5151";

const fetcher = async (relativeUrl: string): Promise<VentasDashboardDto> => {
  const res = await fetch(`${apiBase}${relativeUrl}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    console.error("Error en fetch ventas dashboard", res.status);
    throw new Error(`HTTP_${res.status}`);
  }

  return res.json();
};

export const VentasDashboardFragment: React.FC = () => {
  const [range, setRange] = React.useState<
    "30d" | "90d" | "year" | "all" | "custom"
  >("30d");

  const [topSort, setTopSort] = React.useState<"monto" | "cantidad">("monto");

  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");

  const applyCustomRange = () => {
    if (!fromDate && !toDate) return;
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
      from.setDate(to.getDate() - 29);
    } else if (range === "90d") {
      to = today;
      from = new Date(today);
      from.setDate(to.getDate() - 89);
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
      if (from) params.set("fechaDesde", from.toISOString().slice(0, 10));
      if (to) params.set("fechaHasta", to.toISOString().slice(0, 10));
    }

    const qs = params.toString();
    return `/api/reportes/ventas/dashboard${qs ? `?${qs}` : ""}`;
  }, [range, fromDate, toDate]);

  const { data, error, isLoading } = useSWR<VentasDashboardDto>(
    apiUrl,
    fetcher
  );

  const chartData = React.useMemo(() => {
    if (!data?.porDia) return [];
    return data.porDia.map((d) => ({
      fecha: d.fecha,
      label: formatShortDate(d.fecha),
      cantidadVentas: d.cantidadVentas,
      montoTotal: Number(d.montoTotal ?? 0),
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

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
        Ocurrió un error al cargar el reporte de ventas.
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#05070A] p-8 text-sm text-slate-300">
        Cargando panel de ventas…
      </div>
    );
  }

  const productosSinMovimiento = data.productosSinMovimiento ?? [];
  const ventasPorBodega = data.ventasPorBodega ?? [];
  const rotacionInventario = data.rotacionInventario ?? [];
  const posiblesProblemasStock = data.posiblesProblemasStock ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-wide text-slate-50">
            Panel de ventas
          </h1>
          {data.fechaDesde && data.fechaHasta && (
            <p className="text-xs text-slate-400">
              Rango: {formatShortDate(data.fechaDesde)} –{" "}
              {formatShortDate(data.fechaHasta)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className={pillClass(range === "30d")}
              onClick={() => setRange("30d")}
            >
              Últimos 30 días
            </button>
            <button
              type="button"
              className={pillClass(range === "90d")}
              onClick={() => setRange("90d")}
            >
              Últimos 90 días
            </button>
            <button
              type="button"
              className={pillClass(range === "year")}
              onClick={() => setRange("year")}
            >
              Este año
            </button>
            <button
              type="button"
              className={pillClass(range === "all")}
              onClick={() => setRange("all")}
            >
              Todo
            </button>
          </div>

          <div className="hidden h-8 w-px bg-white/10 md:block" />

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              className={dateInputClass}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span className="text-xs text-slate-400">a</span>
            <input
              type="date"
              className={dateInputClass}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <button
              type="button"
              className="rounded-full bg-[#B01268] px-3 py-1 text-xs font-medium text-slate-50 hover:bg-[#C81D76] transition"
              onClick={applyCustomRange}
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#190016] to-[#020617] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Ventas registradas
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            {formatNumber(data.totalVentas)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#190016] to-[#020617] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Monto total vendido
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#F6A5DA]">
            {formatCurrency(data.montoTotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#190016] to-[#020617] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Ticket promedio
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#FBCFE8]">
            {formatCurrency(data.ticketPromedioGlobal)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1.3fr]">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#120010] to-[#020617] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">
              Ventas por día (monto total)
            </h2>
            <span className="text-[11px] text-slate-400">
              Hover para ver detalles por fecha
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="ventasArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#B01268" stopOpacity={0.9} />
                    <stop offset="90%" stopColor="#4B0430" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#4B5563"
                  strokeOpacity={0.35}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{
                    stroke: "#B01268",
                    strokeWidth: 1,
                    strokeDasharray: "4 2",
                  }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as any;

                    return (
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
                        <div className="text-xs font-semibold text-slate-700">
                          {item.label}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Ventas: {item.cantidadVentas}
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-[#9F1239]">
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
                  strokeWidth={2}
                  fill="url(#ventasArea)"
                  dot={{
                    r: 3,
                    strokeWidth: 1,
                    stroke: "#F9FAFB",
                    fill: "#4B0430",
                  }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#120010] to-[#020617] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Top productos vendidos
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Ordenar por:</span>
              <select
                className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-slate-200"
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

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1 text-xs">
            {sortedTopProductos.length === 0 && (
              <p className="text-xs text-slate-400">
                No hay productos vendidos en el rango seleccionado.
              </p>
            )}

            {sortedTopProductos.map((p, idx) => (
              <div
                key={p.productoID}
                className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4B0430] text-[11px] text-[#FCE7F3]">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-slate-100">
                      {p.nombre || "(Producto)"}{" "}
                      {p.sku && (
                        <span className="text-[10px] text-slate-400">
                          · {p.sku}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Cantidad:{" "}
                      <span className="font-semibold text-slate-200">
                        {formatNumber(p.cantidadVendida)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Monto vendido</p>
                  <p className="text-xs font-semibold text-[#F9A8D4]">
                    {formatCurrency(p.montoVendido)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#120010] p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">
            Productos sin movimiento (top 50)
          </h2>

          <div className="max-h-72 overflow-y-auto pr-1 text-xs">
            {productosSinMovimiento.length === 0 ? (
              <p className="text-slate-400">
                Todos los productos tuvieron al menos una venta en el periodo.
              </p>
            ) : (
              <ul className="space-y-1">
                {productosSinMovimiento.map((p) => (
                  <li
                    key={p.productoID}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-100">
                        {p.nombre}
                      </p>
                      {p.sku && (
                        <p className="text-[11px] text-slate-400">{p.sku}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#120010] p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">
            Ventas por bodega
          </h2>
          <div className="max-h-72 overflow-y-auto pr-1 text-xs space-y-2">
            {ventasPorBodega.length === 0 ? (
              <p className="text-slate-400">
                No hay ventas registradas por bodega en el rango.
              </p>
            ) : (
              ventasPorBodega.map((b) => (
                <div
                  key={b.bodegaID}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-100">
                      {b.nombreBodega}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Cantidad vendida:{" "}
                      <span className="font-semibold text-slate-200">
                        {formatNumber(b.cantidadVendida)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Monto vendido</p>
                    <p className="text-xs font-semibold text-[#F9A8D4]">
                      {formatCurrency(b.montoVendido)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#120010] p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">
            Rotación de inventario (top 50)
          </h2>
          <div className="max-h-72 overflow-y-auto pr-1 text-xs space-y-2">
            {rotacionInventario.length === 0 ? (
              <p className="text-slate-400">
                No hay datos de rotación en el periodo seleccionado.
              </p>
            ) : (
              rotacionInventario.map((r) => (
                <div
                  key={r.productoID}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-100">
                      {r.nombre}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {r.sku} · Vendido:{" "}
                      <span className="font-semibold text-slate-100">
                        {formatNumber(r.cantidadVendida)}
                      </span>{" "}
                      · Stock:{" "}
                      <span className="font-semibold text-slate-100">
                        {formatNumber(r.stockActual)}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#120010] p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">
            Ventas con posible problema de stock
          </h2>
          <div className="max-h-72 overflow-y-auto pr-1 text-xs space-y-2">
            {posiblesProblemasStock.length === 0 ? (
              <p className="text-slate-400">
                No se detectaron posibles problemas de stock en el periodo.
              </p>
            ) : (
              posiblesProblemasStock.map((s) => (
                <div
                  key={`${s.productoID}-${s.bodegaID}`}
                  className="rounded-lg bg-[#3B021F]/80 px-3 py-2 border border-[#B01268]/60"
                >
                  <p className="text-xs font-semibold text-slate-100">
                    {s.nombreProducto}{" "}
                    <span className="text-[10px] text-slate-400">
                      ({s.sku})
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-300">
                    {s.bodegaID === 0
                      ? "Stock global"
                      : `Bodega ${s.bodegaID}`}{" "}
                    · Vendido:{" "}
                    <span className="font-semibold">
                      {formatNumber(s.cantidadVendidaPeriodo)}
                    </span>{" "}
                    · Stock actual:{" "}
                    <span className="font-semibold">
                      {formatNumber(s.stockActual)}
                    </span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
