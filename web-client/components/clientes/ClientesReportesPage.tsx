"use client";

import React, { useEffect, useMemo, useState } from "react";
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

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

type ClienteOption = {
  id: number;
  nombre: string;
};

export default function ClientesReportesPage() {
  const { call } = useApi();

  const [anio, setAnio] = useState<number>(new Date().getFullYear());
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

  const fetchClientes = async () => {
    try {
      const result = await call<any[]>(
        "/api/clientes?soloActivos=true",
        { method: "GET" }
      );

      const mapped: ClienteOption[] = (result ?? [])
        .map((c: any) => ({
          id: c.clienteId ?? c.clienteID ?? c.clienteID ?? c.id ?? 0,
          nombre: c.nombre ?? c.Nombre ?? "Sin nombre",
        }))
        .filter((x) => x.id && x.id > 0);

      setClientes(mapped);
    } catch (err) {
      console.error("Error cargando clientes para dropdown", err);
      setClientes([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const paramsMensual = new URLSearchParams();
      paramsMensual.set("anio", anio.toString());
      if (clienteId.trim() !== "") paramsMensual.set("clienteId", clienteId.trim());
      if (mesDesde) paramsMensual.set("mesDesde", mesDesde);
      if (mesHasta) paramsMensual.set("mesHasta", mesHasta);

      const comprasMensuales = await call<ClienteComprasMensualesPoint[]>(
        `/api/reportes/clientes/compras-mensuales?${paramsMensual.toString()}`,
        { method: "GET" }
      );
      setMensualData(comprasMensuales ?? []);

      const paramsTop = new URLSearchParams();
      paramsTop.set("anio", anio.toString());
      if (mesDesde) paramsTop.set("mesDesde", mesDesde);
      if (mesHasta) paramsTop.set("mesHasta", mesHasta);

      const top = await call<ClienteTopPoint[]>(
        `/api/reportes/clientes/top?${paramsTop.toString()}`,
        { method: "GET" }
      );
      setTopClientes(top ?? []);

      const inact = await call<ClienteInactivoPoint[]>(
        `/api/reportes/clientes/inactivos?meses=${inactivosMeses}`,
        { method: "GET" }
      );
      setInactivos(inact ?? []);

      if (clienteId.trim() !== "") {
        const paramsVentas = new URLSearchParams();
        paramsVentas.set("clienteId", clienteId.trim());
        paramsVentas.set("anio", anio.toString());
        if (mesDesde) paramsVentas.set("mesDesde", mesDesde);
        if (mesHasta) paramsVentas.set("mesHasta", mesHasta);

        const ventas = await call<ClienteVentaDetallePoint[]>(
          `/api/reportes/clientes/ventas-cliente?${paramsVentas.toString()}`,
          { method: "GET" }
        );
        setVentasCliente(ventas ?? []);
      } else {
        setVentasCliente([]);
      }
    } catch (err) {
      console.error(err);
      setMensualData([]);
      setTopClientes([]);
      setInactivos([]);
      setVentasCliente([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes().catch(console.error);
    fetchData().catch(console.error);
  }, []);

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
      mensualData.map((d) => ({
        ...d,
        mesTexto: MESES[d.mes - 1] ?? `Mes ${d.mes}`,
      })),
    [mensualData]
  );

  const totalClientesAnio = mensualData.reduce((acc, x) => acc + x.totalClientes, 0);
  const totalVentasAnio = mensualData.reduce((acc, x) => acc + x.totalVentas, 0);
  const montoTotalAnio = mensualData.reduce((acc, x) => acc + Number(x.montoTotal), 0);

  const ticketPromedioAnual =
    totalVentasAnio > 0 ? montoTotalAnio / totalVentasAnio : 0;

  const topOrdenado = useMemo(
    () =>
      [...topClientes].sort((a, b) => Number(b.montoTotal) - Number(a.montoTotal)),
    [topClientes]
  );

  const topSlice = useMemo(
    () => topOrdenado.slice(0, Math.max(1, topN)),
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

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#E6E9EA] p-6 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide">
            Reportes de clientes
          </h1>
          <p className="text-sm text-[#8B9AA0]">
            Análisis de clientes: compras mensuales, ranking, inactivos y detalle
            por cliente.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3 justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8B9AA0]">Año:</span>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="w-24 rounded-xl border border-white/10 bg-[#121618] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8B9AA0]">Mes desde:</span>
              <select
                value={mesDesde}
                onChange={(e) => setMesDesde(e.target.value)}
                className="w-28 rounded-xl border border-white/10 bg-[#121618] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent"
              >
                <option value="">Todos</option>
                {MESES.map((m, idx) => (
                  <option key={idx} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8B9AA0]">Mes hasta:</span>
              <select
                value={mesHasta}
                onChange={(e) => setMesHasta(e.target.value)}
                className="w-28 rounded-xl border border-white/10 bg-[#121618] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent"
              >
                <option value="">Todos</option>
                {MESES.map((m, idx) => (
                  <option key={idx} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8B9AA0]">Cliente:</span>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="min-w-[180px] rounded-xl border border-white/10 bg-[#121618] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent"
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

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? "Cargando..." : "Actualizar"}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#121618] p-4">
          <p className="text-xs uppercase tracking-wide text-[#8B9AA0]">
            Total clientes únicos (suma mensual)
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {totalClientesAnio}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121618] p-4">
          <p className="text-xs uppercase tracking-wide text-[#8B9AA0]">
            Total ventas
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {totalVentasAnio}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121618] p-4">
          <p className="text-xs uppercase tracking-wide text-[#8B9AA0]">
            Monto facturado (año)
          </p>
          <p className="mt-2 text-2xl font-semibold">
            ₡{montoTotalAnio.toLocaleString("es-CR", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121618] p-4">
          <p className="text-xs uppercase tracking-wide text-[#8B9AA0]">
            Ticket promedio (año)
          </p>
          <p className="mt-2 text-2xl font-semibold">
            ₡{ticketPromedioAnual.toLocaleString("es-CR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121618] p-4 space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-[#E6E9EA]">
          Clientes y ventas por mes
        </h2>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mesTexto" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="totalClientes"
                name="Clientes que compraron"
                fill="#22C55E"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="totalVentas"
                name="Ventas registradas"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121618] p-4">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-[#E6E9EA]">
          Detalle mensual (ticket promedio y recurrencia)
        </h2>

        {chartData.length === 0 ? (
          <p className="text-sm text-[#8B9AA0]">
            No hay datos para los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/10 text-left text-xs uppercase text-[#8B9AA0]">
                <tr>
                  <th className="px-2 py-2">Año</th>
                  <th className="px-2 py-2">Mes</th>
                  <th className="px-2 py-2 text-right">Clientes</th>
                  <th className="px-2 py-2 text-right">Ventas</th>
                  <th className="px-2 py-2 text-right">Ticket prom.</th>
                  <th className="px-2 py-2 text-right">Recurrencia</th>
                  <th className="px-2 py-2 text-right">Monto total</th>
                  <th className="px-2 py-2 text-right">% vs mes ant.</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => {
                  const ticketMes =
                    row.totalVentas > 0
                      ? Number(row.montoTotal) / row.totalVentas
                      : 0;
                  const recurrencia =
                    row.totalClientes > 0
                      ? row.totalVentas / row.totalClientes
                      : 0;

                  const prev = index > 0 ? chartData[index - 1] : null;
                  const varPct =
                    prev && prev.montoTotal
                      ? ((Number(row.montoTotal) - Number(prev.montoTotal)) /
                          Number(prev.montoTotal)) *
                        100
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
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-2 py-2">{row.anio}</td>
                      <td className="px-2 py-2">{row.mesTexto}</td>
                      <td className="px-2 py-2 text-right">
                        {row.totalClientes}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {row.totalVentas}
                      </td>
                      <td className="px-2 py-2 text-right">
                        ₡{ticketMes.toLocaleString("es-CR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {recurrencia.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        ₡{Number(row.montoTotal).toLocaleString("es-CR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className={`px-2 py-2 text-right ${varClass}`}>
                        {varText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121618] p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-[#E6E9EA]">
            Top clientes por monto
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8B9AA0]">Mostrar:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={topN}
              onChange={(e) =>
                setTopN(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-20 rounded-xl border border-white/10 bg-[#121618] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent"
            />
            <span className="text-sm text-[#8B9AA0]">clientes</span>
          </div>
        </div>

        {topSlice.length === 0 ? (
          <p className="text-sm text-[#8B9AA0]">
            No hay información de ranking de clientes para el periodo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/10 text-left text-xs uppercase text-[#8B9AA0]">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Cliente</th>
                  <th className="px-2 py-2 text-right">Ventas</th>
                  <th className="px-2 py-2 text-right">Monto total</th>
                  <th className="px-2 py-2 text-right">Ticket prom.</th>
                  <th className="px-2 py-2 text-right">Última compra</th>
                </tr>
              </thead>
              <tbody>
                {topSlice.map((row, index) => {
                  const nombre =
                    clienteNombreMap[row.clienteID] ??
                    `Cliente #${row.clienteID}`;

                  return (
                    <tr
                      key={row.clienteID}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-2 py-2">{index + 1}</td>
                      <td className="px-2 py-2">{nombre}</td>
                      <td className="px-2 py-2 text-right">
                        {row.totalVentas}
                      </td>
                      <td className="px-2 py-2 text-right">
                        ₡{Number(row.montoTotal).toLocaleString("es-CR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-right">
                        ₡{Number(row.ticketPromedio).toLocaleString("es-CR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {new Date(row.ultimaCompra).toLocaleDateString(
                          "es-CR",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          }
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121618] p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-[#E6E9EA]">
            Clientes inactivos (riesgo de fuga)
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8B9AA0]">Sin comprar hace:</span>
            <input
              type="number"
              min={1}
              max={60}
              value={inactivosMeses}
              onChange={(e) =>
                setInactivosMeses(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-24 rounded-xl border border-white/10 bg-[#121618] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent"
            />
            <span className="text-sm text-[#8B9AA0]">meses</span>
          </div>
        </div>

        {inactivosOrdenados.length === 0 ? (
          <p className="text-sm text-[#8B9AA0]">
            No hay clientes que cumplan el criterio de inactividad.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/10 text-left text-xs uppercase text-[#8B9AA0]">
                <tr>
                  <th className="px-2 py-2">Cliente</th>
                  <th className="px-2 py-2 text-right">Última compra</th>
                  <th className="px-2 py-2 text-right">Ventas totales</th>
                  <th className="px-2 py-2 text-right">Monto total</th>
                  <th className="px-2 py-2 text-right">Meses sin compra</th>
                </tr>
              </thead>
              <tbody>
                {inactivosOrdenados.map((row) => {
                  const nombre =
                    clienteNombreMap[row.clienteID] ??
                    `Cliente #${row.clienteID}`;

                  return (
                    <tr
                      key={row.clienteID}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-2 py-2">{nombre}</td>
                      <td className="px-2 py-2 text-right">
                        {new Date(row.ultimaCompra).toLocaleDateString(
                          "es-CR",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          }
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {row.totalVentas}
                      </td>
                      <td className="px-2 py-2 text-right">
                        ₡{Number(row.montoTotal).toLocaleString("es-CR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {row.mesesSinCompra}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121618] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-[#E6E9EA]">
            Detalle de ventas por cliente
          </h2>
          {clienteSeleccionadoNombre && (
            <p className="text-sm text-[#8B9AA0]">
              Cliente seleccionado:{" "}
              <span className="font-medium text-[#E6E9EA]">
                {clienteSeleccionadoNombre}
              </span>
            </p>
          )}
        </div>

        {!clienteId ? (
          <p className="text-sm text-[#8B9AA0]">
            Selecciona un cliente en el filtro superior y haz clic en{" "}
            <span className="font-semibold">Actualizar</span> para ver su
            historial de ventas.
          </p>
        ) : ventasCliente.length === 0 ? (
          <p className="text-sm text-[#8B9AA0]">
            No hay ventas registradas para el cliente y periodo seleccionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/10 text-left text-xs uppercase text-[#8B9AA0]">
                <tr>
                  <th className="px-2 py-2">Venta</th>
                  <th className="px-2 py-2">Fecha</th>
                  <th className="px-2 py-2 text-right">Líneas</th>
                  <th className="px-2 py-2 text-right">Subtotal</th>
                  <th className="px-2 py-2 text-right">Descuento</th>
                  <th className="px-2 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {ventasCliente.map((v) => (
                  <tr
                    key={v.ventaID}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-2 py-2">#{v.ventaID}</td>
                    <td className="px-2 py-2">
                      {new Date(v.fecha).toLocaleString("es-CR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {v.cantidadLineas}
                    </td>
                    <td className="px-2 py-2 text-right">
                      ₡{Number(v.subTotal).toLocaleString("es-CR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-2 py-2 text-right">
                      ₡{Number(v.descuento).toLocaleString("es-CR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-2 py-2 text-right">
                      ₡{Number(v.total).toLocaleString("es-CR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
