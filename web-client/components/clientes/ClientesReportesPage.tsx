"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "../hooks/useApi";
import Button from "../buttons/button";
import {
  ClienteComprasMensualesPoint,
  ClienteTopPoint,
  ClienteInactivoPoint,
  ClienteVentaDetallePoint,
} from "./clientes-report-types";
import * as Recharts from "recharts";

const ResponsiveContainer: React.FC<any> = (props) =>
  React.createElement(Recharts.ResponsiveContainer as any, props);

const BarChart: React.FC<any> = (props) =>
  React.createElement(Recharts.BarChart as any, props);

const Bar: React.FC<any> = (props) =>
  React.createElement(Recharts.Bar as any, props);

const XAxis: React.FC<any> = (props) =>
  React.createElement(Recharts.XAxis as any, props);

const YAxis: React.FC<any> = (props) =>
  React.createElement(Recharts.YAxis as any, props);

const Tooltip: React.FC<any> = (props) =>
  React.createElement(Recharts.Tooltip as any, props);

const CartesianGrid: React.FC<any> = (props) =>
  React.createElement(Recharts.CartesianGrid as any, props);

const Legend: React.FC<any> = (props) =>
  React.createElement(Recharts.Legend as any, props);

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const CURRENT_YEAR = new Date().getFullYear();

type ClienteOption = {
  id: number;
  nombre: string;
};

function formatCurrency(value: number) {
  return `₡${Number(value || 0).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCurrencyInt(value: number) {
  return `₡${Number(value || 0).toLocaleString("es-CR", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value: string | Date) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(value: string | Date) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toPositiveInt(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.trunc(num));
}

function normalizeClienteOption(raw: any): ClienteOption | null {
  const id = toPositiveInt(
    raw?.clienteId ?? raw?.clienteID ?? raw?.ClienteID ?? raw?.id ?? raw?.ID
  );

  if (id <= 0) return null;

  const nombre = String(
    raw?.nombre ??
      raw?.Nombre ??
      raw?.nombreCliente ??
      raw?.NombreCliente ??
      `Cliente #${id}`
  ).trim();

  return {
    id,
    nombre: nombre || `Cliente #${id}`,
  };
}

function normalizeMensualPoint(raw: any): ClienteComprasMensualesPoint {
  return {
    anio: toPositiveInt(raw?.anio ?? raw?.Anio),
    mes: toPositiveInt(raw?.mes ?? raw?.Mes),
    totalClientes: toPositiveInt(raw?.totalClientes ?? raw?.TotalClientes),
    totalVentas: toPositiveInt(raw?.totalVentas ?? raw?.TotalVentas),
    montoTotal: Number(raw?.montoTotal ?? raw?.MontoTotal ?? 0),
  };
}

function normalizeTopPoint(raw: any): ClienteTopPoint {
  return {
    clienteID: toPositiveInt(raw?.clienteID ?? raw?.clienteId ?? raw?.ClienteID),
    totalVentas: toPositiveInt(raw?.totalVentas ?? raw?.TotalVentas),
    montoTotal: Number(raw?.montoTotal ?? raw?.MontoTotal ?? 0),
    ticketPromedio: Number(raw?.ticketPromedio ?? raw?.TicketPromedio ?? 0),
    ultimaCompra: String(raw?.ultimaCompra ?? raw?.UltimaCompra ?? ""),
  };
}

function normalizeInactivoPoint(raw: any): ClienteInactivoPoint {
  return {
    clienteID: toPositiveInt(raw?.clienteID ?? raw?.clienteId ?? raw?.ClienteID),
    totalVentas: toPositiveInt(raw?.totalVentas ?? raw?.TotalVentas),
    montoTotal: Number(raw?.montoTotal ?? raw?.MontoTotal ?? 0),
    ultimaCompra: String(raw?.ultimaCompra ?? raw?.UltimaCompra ?? ""),
    mesesSinCompra: toPositiveInt(raw?.mesesSinCompra ?? raw?.MesesSinCompra),
  };
}

function normalizeVentaDetallePoint(raw: any): ClienteVentaDetallePoint {
  return {
    ventaID: toPositiveInt(raw?.ventaID ?? raw?.ventaId ?? raw?.VentaID),
    fecha: String(raw?.fecha ?? raw?.Fecha ?? ""),
    subTotal: Number(raw?.subTotal ?? raw?.subtotal ?? raw?.SubTotal ?? 0),
    descuento: Number(raw?.descuento ?? raw?.Descuento ?? 0),
    total: Number(raw?.total ?? raw?.Total ?? 0),
    cantidadLineas: toPositiveInt(raw?.cantidadLineas ?? raw?.CantidadLineas),
  };
}

const cardClass =
  "rounded-3xl border border-white/10 bg-gradient-to-br from-[#151A1D] to-[#101416] shadow-[0_16px_40px_rgba(0,0,0,0.28)]";
const sectionTitleClass =
  "text-sm font-semibold tracking-[0.18em] uppercase text-[#F3F4F6]";
const subtleTextClass = "text-sm text-[#8B9AA0]";
const inputClass =
  "rounded-xl border border-white/10 bg-[#121618] px-3 py-2 text-sm text-[#E6E9EA] outline-none transition focus:border-[#A30862]/40 focus:ring-2 focus:ring-[#A30862]/30";

export default function ClientesReportesPage() {
  const { call } = useApi();

  const [anio, setAnio] = useState<number>(CURRENT_YEAR);
  const [clienteId, setClienteId] = useState<string>("");
  const [mesDesde, setMesDesde] = useState<string>("");
  const [mesHasta, setMesHasta] = useState<string>("");

  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [mensualData, setMensualData] = useState<ClienteComprasMensualesPoint[]>([]);
  const [topClientes, setTopClientes] = useState<ClienteTopPoint[]>([]);
  const [topN, setTopN] = useState<number>(10);
  const [inactivosMeses, setInactivosMeses] = useState<number>(3);
  const [inactivos, setInactivos] = useState<ClienteInactivoPoint[]>([]);
  const [ventasCliente, setVentasCliente] = useState<ClienteVentaDetallePoint[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const clienteNombreMap = useMemo(() => {
    const map: Record<number, string> = {};
    clientes.forEach((c) => {
      map[c.id] = c.nombre;
    });
    return map;
  }, [clientes]);

  const clienteSeleccionadoNombre = useMemo(() => {
    const idNum = Number(clienteId);
    if (!idNum) return "";
    return clienteNombreMap[idNum] ?? `Cliente #${idNum}`;
  }, [clienteId, clienteNombreMap]);

  const chartData = useMemo(
    () =>
      mensualData
        .filter((d) => d.mes >= 1 && d.mes <= 12)
        .map((d) => ({
          ...d,
          mesTexto: MESES[d.mes - 1] ?? `Mes ${d.mes}`,
        })),
    [mensualData]
  );

  const totalClientesAnio = useMemo(
    () => mensualData.reduce((acc, x) => acc + x.totalClientes, 0),
    [mensualData]
  );

  const totalVentasAnio = useMemo(
    () => mensualData.reduce((acc, x) => acc + x.totalVentas, 0),
    [mensualData]
  );

  const montoTotalAnio = useMemo(
    () => mensualData.reduce((acc, x) => acc + Number(x.montoTotal), 0),
    [mensualData]
  );

  const ticketPromedioAnual = totalVentasAnio > 0 ? montoTotalAnio / totalVentasAnio : 0;

  const topOrdenado = useMemo(
    () => [...topClientes].sort((a, b) => Number(b.montoTotal) - Number(a.montoTotal)),
    [topClientes]
  );

  const topSlice = useMemo(
    () => topOrdenado.slice(0, Math.max(1, Math.min(100, topN))),
    [topOrdenado, topN]
  );

  const inactivosOrdenados = useMemo(
    () =>
      [...inactivos].sort(
        (a, b) =>
          new Date(a.ultimaCompra).getTime() - new Date(b.ultimaCompra).getTime()
      ),
    [inactivos]
  );

  const validateFilters = useCallback(() => {
    if (!Number.isFinite(anio) || anio < 2000 || anio > CURRENT_YEAR + 1) {
      return `El año debe estar entre 2000 y ${CURRENT_YEAR + 1}.`;
    }

    const desde = mesDesde ? Number(mesDesde) : null;
    const hasta = mesHasta ? Number(mesHasta) : null;

    if (desde !== null && (!Number.isInteger(desde) || desde < 1 || desde > 12)) {
      return "Mes desde debe estar entre 1 y 12.";
    }

    if (hasta !== null && (!Number.isInteger(hasta) || hasta < 1 || hasta > 12)) {
      return "Mes hasta debe estar entre 1 y 12.";
    }

    if (desde !== null && hasta !== null && desde > hasta) {
      return "El mes desde no puede ser mayor que el mes hasta.";
    }

    if (clienteId.trim() !== "" && Number(clienteId) <= 0) {
      return "El cliente seleccionado no es válido.";
    }

    if (!Number.isFinite(inactivosMeses) || inactivosMeses < 1 || inactivosMeses > 60) {
      return "Meses de inactividad debe estar entre 1 y 60.";
    }

    if (!Number.isFinite(topN) || topN < 1 || topN > 100) {
      return "La cantidad de clientes a mostrar debe estar entre 1 y 100.";
    }

    return "";
  }, [anio, clienteId, inactivosMeses, mesDesde, mesHasta, topN]);

  const fetchClientes = useCallback(async () => {
    try {
      const result = await call<any[]>("/api/clientes?soloActivos=true", {
        method: "GET",
      });

      const mapped = (Array.isArray(result) ? result : [])
        .map(normalizeClienteOption)
        .filter((x): x is ClienteOption => x !== null)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));

      setClientes(mapped);
    } catch (err) {
      console.error("Error cargando clientes para dropdown", err);
      setClientes([]);
    }
  }, [call]);

  const fetchData = useCallback(async () => {
    const validationError = validateFilters();

    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const paramsMensual = new URLSearchParams();
      paramsMensual.set("anio", anio.toString());
      if (clienteId.trim() !== "") paramsMensual.set("clienteId", clienteId.trim());
      if (mesDesde) paramsMensual.set("mesDesde", mesDesde);
      if (mesHasta) paramsMensual.set("mesHasta", mesHasta);

      const comprasMensualesResponse = await call<any[]>(
        `/api/reportes/clientes/compras-mensuales?${paramsMensual.toString()}`,
        { method: "GET" }
      );

      const mensualNormalizado = (Array.isArray(comprasMensualesResponse) ? comprasMensualesResponse : [])
        .map(normalizeMensualPoint);

      setMensualData(mensualNormalizado);

      const paramsTop = new URLSearchParams();
      paramsTop.set("anio", anio.toString());
      if (mesDesde) paramsTop.set("mesDesde", mesDesde);
      if (mesHasta) paramsTop.set("mesHasta", mesHasta);

      const topResponse = await call<any[]>(
        `/api/reportes/clientes/top?${paramsTop.toString()}`,
        { method: "GET" }
      );

      const topNormalizado = (Array.isArray(topResponse) ? topResponse : [])
        .map(normalizeTopPoint)
        .filter((x) => x.clienteID > 0);

      setTopClientes(topNormalizado);

      const inactivosResponse = await call<any[]>(
        `/api/reportes/clientes/inactivos?meses=${inactivosMeses}`,
        { method: "GET" }
      );

      const inactivosNormalizados = (Array.isArray(inactivosResponse) ? inactivosResponse : [])
        .map(normalizeInactivoPoint)
        .filter((x) => x.clienteID > 0);

      setInactivos(inactivosNormalizados);

      if (clienteId.trim() !== "") {
        const paramsVentas = new URLSearchParams();
        paramsVentas.set("clienteId", clienteId.trim());
        paramsVentas.set("anio", anio.toString());
        if (mesDesde) paramsVentas.set("mesDesde", mesDesde);
        if (mesHasta) paramsVentas.set("mesHasta", mesHasta);

        const ventasResponse = await call<any[]>(
          `/api/reportes/clientes/ventas-cliente?${paramsVentas.toString()}`,
          { method: "GET" }
        );

        const ventasNormalizadas = (Array.isArray(ventasResponse) ? ventasResponse : [])
          .map(normalizeVentaDetallePoint)
          .filter((x) => x.ventaID > 0);

        setVentasCliente(ventasNormalizadas);
      } else {
        setVentasCliente([]);
      }

      const updatedText = new Date().toLocaleString("es-CR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      setLastUpdated(updatedText);
      setSuccessMessage("Reportes actualizados correctamente.");
    } catch (err: any) {
      console.error(err);

      const backendMessage =
        err?.message ||
        err?.response?.data?.title ||
        err?.response?.data ||
        "No se pudieron cargar los reportes. Intenta nuevamente.";

      setErrorMessage(String(backendMessage));
      setSuccessMessage("");
      setMensualData([]);
      setTopClientes([]);
      setInactivos([]);
      setVentasCliente([]);
    } finally {
      setLoading(false);
    }
  }, [anio, call, clienteId, inactivosMeses, mesDesde, mesHasta, validateFilters]);

  const handleResetFilters = useCallback(() => {
    setAnio(CURRENT_YEAR);
    setClienteId("");
    setMesDesde("");
    setMesHasta("");
    setTopN(10);
    setInactivosMeses(3);
    setErrorMessage("");
    setSuccessMessage("");
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchClientes();
      await fetchData();
    };

    loadInitialData().catch(console.error);
  }, [fetchClientes, fetchData]);

  return (
    <div className="min-h-screen bg-[#0B0F0E] px-4 py-6 text-[#E6E9EA] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <header className={`${cardClass} overflow-hidden p-5 sm:p-6`}>
          <div className="absolute" />

          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full border border-[#A30862]/30 bg-[#A30862]/10 px-3 py-1 text-xs font-medium tracking-wide text-[#F472B6]">
                Módulo de análisis
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-wide sm:text-3xl">
                  Reportes de clientes
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#94A3B8]">
                  Visualiza comportamiento de compra, ranking de clientes,
                  inactividad y detalle de ventas con una presentación más clara
                  y ordenada.
                </p>
              </div>

              {lastUpdated && (
                <p className="text-xs text-[#64748B]">
                  Última actualización: {lastUpdated}
                </p>
              )}
            </div>

            <div className="w-full xl:max-w-[950px]">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-[0.14em] text-[#8B9AA0]">
                    Año
                  </label>
                  <input
                    type="number"
                    min={2000}
                    max={CURRENT_YEAR + 1}
                    value={anio}
                    onChange={(e) =>
                      setAnio(
                        Math.min(
                          CURRENT_YEAR + 1,
                          Math.max(2000, Number(e.target.value) || CURRENT_YEAR)
                        )
                      )
                    }
                    className={`${inputClass} w-full`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-[0.14em] text-[#8B9AA0]">
                    Mes desde
                  </label>
                  <select
                    value={mesDesde}
                    onChange={(e) => setMesDesde(e.target.value)}
                    className={`${inputClass} w-full`}
                  >
                    <option value="">Todos</option>
                    {MESES.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-[0.14em] text-[#8B9AA0]">
                    Mes hasta
                  </label>
                  <select
                    value={mesHasta}
                    onChange={(e) => setMesHasta(e.target.value)}
                    className={`${inputClass} w-full`}
                  >
                    <option value="">Todos</option>
                    {MESES.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-[0.14em] text-[#8B9AA0]">
                    Cliente
                  </label>
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className={`${inputClass} w-full`}
                  >
                    <option value="">Todos</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button variant="primary" onClick={fetchData} disabled={loading}>
                  {loading ? "Cargando..." : "Actualizar"}
                </Button>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  disabled={loading}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#E6E9EA] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {(errorMessage || successMessage) && (
            <div className="mt-5 space-y-2">
              {errorMessage && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {errorMessage}
                </div>
              )}

              {!errorMessage && successMessage && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {successMessage}
                </div>
              )}
            </div>
          )}
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`${cardClass} p-5`}>
            <p className="text-xs uppercase tracking-[0.16em] text-[#8B9AA0]">
              Total clientes únicos
            </p>
            <p className="mt-3 text-3xl font-semibold">{totalClientesAnio}</p>
            <p className="mt-2 text-xs leading-5 text-[#6B7B83]">
              Suma mensual de clientes compradores en el periodo actual.
            </p>
          </div>

          <div className={`${cardClass} p-5`}>
            <p className="text-xs uppercase tracking-[0.16em] text-[#8B9AA0]">
              Total ventas
            </p>
            <p className="mt-3 text-3xl font-semibold">{totalVentasAnio}</p>
            <p className="mt-2 text-xs leading-5 text-[#6B7B83]">
              Cantidad de ventas registradas según el filtro aplicado.
            </p>
          </div>

          <div className={`${cardClass} p-5`}>
            <p className="text-xs uppercase tracking-[0.16em] text-[#8B9AA0]">
              Monto facturado
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {formatCurrencyInt(montoTotalAnio)}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#6B7B83]">
              Total acumulado vendido dentro del rango seleccionado.
            </p>
          </div>

          <div className={`${cardClass} p-5`}>
            <p className="text-xs uppercase tracking-[0.16em] text-[#8B9AA0]">
              Ticket promedio
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {formatCurrency(ticketPromedioAnual)}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#6B7B83]">
              Valor promedio generado por cada venta.
            </p>
          </div>
        </section>

        <section className={`${cardClass} p-5 sm:p-6`}>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className={sectionTitleClass}>Clientes y ventas por mes</h2>
              <p className="mt-2 text-sm text-[#94A3B8]">
                Comparativo visual entre clientes compradores y ventas mensuales.
              </p>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-12 text-center text-sm text-[#8B9AA0]">
              No hay datos para construir la gráfica con los filtros seleccionados.
            </div>
          ) : (
            <div className="h-80 w-full rounded-2xl border border-white/5 bg-[#0F1315] p-3 sm:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263036" />
                  <XAxis dataKey="mesTexto" stroke="#8B9AA0" tickLine={false} axisLine={false} />
                  <YAxis stroke="#8B9AA0" tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: any, name: any) => [value, name]}
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "14px",
                      color: "#E6E9EA",
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Legend />
                  <Bar
                    dataKey="totalClientes"
                    name="Clientes que compraron"
                    fill="#22C55E"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="totalVentas"
                    name="Ventas registradas"
                    fill="#3B82F6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className={`${cardClass} p-5 sm:p-6`}>
          <div className="mb-4">
            <h2 className={sectionTitleClass}>Detalle mensual</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">
              Resumen tabular con ticket promedio, recurrencia y variación mensual.
            </p>
          </div>

          {chartData.length === 0 ? (
            <p className={subtleTextClass}>
              No hay datos para los filtros seleccionados.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0F1315]">
              <table className="min-w-full text-sm">
                <thead className="border-b border-white/10 bg-white/[0.02] text-left text-[11px] uppercase tracking-[0.14em] text-[#8B9AA0]">
                  <tr>
                    <th className="px-3 py-3">Año</th>
                    <th className="px-3 py-3">Mes</th>
                    <th className="px-3 py-3 text-right">Clientes</th>
                    <th className="px-3 py-3 text-right">Ventas</th>
                    <th className="px-3 py-3 text-right">Ticket prom.</th>
                    <th className="px-3 py-3 text-right">Recurrencia</th>
                    <th className="px-3 py-3 text-right">Monto total</th>
                    <th className="px-3 py-3 text-right">% vs mes ant.</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, index) => {
                    const ticketMes =
                      row.totalVentas > 0 ? Number(row.montoTotal) / row.totalVentas : 0;

                    const recurrencia =
                      row.totalClientes > 0 ? row.totalVentas / row.totalClientes : 0;

                    const prev = index > 0 ? chartData[index - 1] : null;
                    const prevMonto = prev ? Number(prev.montoTotal) : 0;

                    const varPct =
                      prev && prevMonto > 0
                        ? ((Number(row.montoTotal) - prevMonto) / prevMonto) * 100
                        : null;

                    const varText =
                      varPct === null
                        ? "—"
                        : `${varPct >= 0 ? "+" : ""}${varPct.toFixed(1)}%`;

                    const varClass =
                      varPct === null
                        ? "text-[#E6E9EA]"
                        : varPct >= 0
                        ? "text-emerald-400"
                        : "text-rose-400";

                    return (
                      <tr
                        key={`${row.anio}-${row.mes}`}
                        className="border-b border-white/5 transition hover:bg-white/[0.02] last:border-0"
                      >
                        <td className="px-3 py-3">{row.anio}</td>
                        <td className="px-3 py-3">{row.mesTexto}</td>
                        <td className="px-3 py-3 text-right">{row.totalClientes}</td>
                        <td className="px-3 py-3 text-right">{row.totalVentas}</td>
                        <td className="px-3 py-3 text-right">
                          {formatCurrency(ticketMes)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {recurrencia.toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatCurrency(Number(row.montoTotal))}
                        </td>
                        <td className={`px-3 py-3 text-right font-medium ${varClass}`}>
                          {varText}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={`${cardClass} p-5 sm:p-6`}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className={sectionTitleClass}>Top clientes por monto</h2>
              <p className="mt-2 text-sm text-[#94A3B8]">
                Visualiza los clientes con mayor aporte económico en el periodo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8B9AA0]">Mostrar:</span>
              <input
                type="number"
                min={1}
                max={100}
                value={topN}
                onChange={(e) =>
                  setTopN(Math.min(100, Math.max(1, Number(e.target.value) || 1)))
                }
                className={`${inputClass} w-20 px-2 py-1.5`}
              />
              <span className="text-sm text-[#8B9AA0]">clientes</span>
            </div>
          </div>

          {topSlice.length === 0 ? (
            <p className={subtleTextClass}>
              No hay información de ranking de clientes para el periodo.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0F1315]">
              <table className="min-w-full text-sm">
                <thead className="border-b border-white/10 bg-white/[0.02] text-left text-[11px] uppercase tracking-[0.14em] text-[#8B9AA0]">
                  <tr>
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3 text-right">Ventas</th>
                    <th className="px-3 py-3 text-right">Monto total</th>
                    <th className="px-3 py-3 text-right">Ticket prom.</th>
                    <th className="px-3 py-3 text-right">Última compra</th>
                  </tr>
                </thead>
                <tbody>
                  {topSlice.map((row, index) => {
                    const nombre =
                      clienteNombreMap[row.clienteID] ?? `Cliente #${row.clienteID}`;

                    return (
                      <tr
                        key={`${row.clienteID}-${index}`}
                        className="border-b border-white/5 transition hover:bg-white/[0.02] last:border-0"
                      >
                        <td className="px-3 py-3 font-medium">{index + 1}</td>
                        <td className="px-3 py-3">{nombre}</td>
                        <td className="px-3 py-3 text-right">{row.totalVentas}</td>
                        <td className="px-3 py-3 text-right">
                          {formatCurrency(Number(row.montoTotal))}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatCurrency(Number(row.ticketPromedio))}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatDate(row.ultimaCompra)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={`${cardClass} p-5 sm:p-6`}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className={sectionTitleClass}>Clientes inactivos</h2>
              <p className="mt-2 text-sm text-[#94A3B8]">
                Identifica clientes con riesgo de fuga según el tiempo sin compra.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8B9AA0]">Sin comprar hace:</span>
              <input
                type="number"
                min={1}
                max={60}
                value={inactivosMeses}
                onChange={(e) =>
                  setInactivosMeses(
                    Math.min(60, Math.max(1, Number(e.target.value) || 1))
                  )
                }
                className={`${inputClass} w-24 px-2 py-1.5`}
              />
              <span className="text-sm text-[#8B9AA0]">meses</span>
            </div>
          </div>

          {inactivosOrdenados.length === 0 ? (
            <p className={subtleTextClass}>
              No hay clientes que cumplan el criterio de inactividad.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0F1315]">
              <table className="min-w-full text-sm">
                <thead className="border-b border-white/10 bg-white/[0.02] text-left text-[11px] uppercase tracking-[0.14em] text-[#8B9AA0]">
                  <tr>
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3 text-right">Última compra</th>
                    <th className="px-3 py-3 text-right">Ventas totales</th>
                    <th className="px-3 py-3 text-right">Monto total</th>
                    <th className="px-3 py-3 text-right">Meses sin compra</th>
                  </tr>
                </thead>
                <tbody>
                  {inactivosOrdenados.map((row) => {
                    const nombre =
                      clienteNombreMap[row.clienteID] ?? `Cliente #${row.clienteID}`;

                    return (
                      <tr
                        key={row.clienteID}
                        className="border-b border-white/5 transition hover:bg-white/[0.02] last:border-0"
                      >
                        <td className="px-3 py-3">{nombre}</td>
                        <td className="px-3 py-3 text-right">
                          {formatDate(row.ultimaCompra)}
                        </td>
                        <td className="px-3 py-3 text-right">{row.totalVentas}</td>
                        <td className="px-3 py-3 text-right">
                          {formatCurrency(Number(row.montoTotal))}
                        </td>
                        <td className="px-3 py-3 text-right font-medium">
                          {row.mesesSinCompra}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={`${cardClass} p-5 sm:p-6`}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className={sectionTitleClass}>Detalle de ventas por cliente</h2>
              <p className="mt-2 text-sm text-[#94A3B8]">
                Consulta el historial individual del cliente seleccionado.
              </p>
            </div>

            {clienteSeleccionadoNombre && (
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#CBD5E1]">
                Cliente seleccionado:{" "}
                <span className="font-medium text-white">
                  {clienteSeleccionadoNombre}
                </span>
              </div>
            )}
          </div>

          {!clienteId ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm text-[#8B9AA0]">
              Selecciona un cliente en el filtro superior y pulsa{" "}
              <span className="font-semibold text-[#E6E9EA]">Actualizar</span> para
              ver su historial de ventas.
            </div>
          ) : ventasCliente.length === 0 ? (
            <p className={subtleTextClass}>
              No hay ventas registradas para el cliente y periodo seleccionado.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0F1315]">
              <table className="min-w-full text-sm">
                <thead className="border-b border-white/10 bg-white/[0.02] text-left text-[11px] uppercase tracking-[0.14em] text-[#8B9AA0]">
                  <tr>
                    <th className="px-3 py-3">Venta</th>
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3 text-right">Líneas</th>
                    <th className="px-3 py-3 text-right">Subtotal</th>
                    <th className="px-3 py-3 text-right">Descuento</th>
                    <th className="px-3 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasCliente.map((v) => (
                    <tr
                      key={v.ventaID}
                      className="border-b border-white/5 transition hover:bg-white/[0.02] last:border-0"
                    >
                      <td className="px-3 py-3 font-medium">#{v.ventaID}</td>
                      <td className="px-3 py-3">{formatDateTime(v.fecha)}</td>
                      <td className="px-3 py-3 text-right">{v.cantidadLineas}</td>
                      <td className="px-3 py-3 text-right">
                        {formatCurrency(Number(v.subTotal))}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatCurrency(Number(v.descuento))}
                      </td>
                      <td className="px-3 py-3 text-right font-medium">
                        {formatCurrency(Number(v.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}