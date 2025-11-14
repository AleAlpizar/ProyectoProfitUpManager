"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useApi } from "../hooks/useApi";
import Button from "../buttons/button";
import { ClienteComprasMensualesPoint } from "./clientes-report-types";

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

export default function ClientesReportesPage() {
  const { call } = useApi();
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [data, setData] = useState<ClienteComprasMensualesPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await call<ClienteComprasMensualesPoint[]>(
        `/api/reportes/clientes/compras-mensuales?anio=${anio}`,
        { method: "GET" }
      );
      setData(result ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData().catch(console.error);
  }, []);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        mesTexto: MESES[d.mes - 1] ?? `Mes ${d.mes}`,
      })),
    [data]
  );

  const totalClientesAnio = data.reduce((acc, x) => acc + x.totalClientes, 0);
  const totalVentasAnio = data.reduce((acc, x) => acc + x.totalVentas, 0);
  const montoTotalAnio = data.reduce((acc, x) => acc + Number(x.montoTotal), 0);

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#E6E9EA] p-6 space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide">
            Reportes de clientes
          </h1>
          <p className="text-sm text-[#8B9AA0]">
            Clientes que han comprado por mes, total de ventas y monto facturado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8B9AA0]">Año:</span>
            <input
              type="number"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="w-24 rounded-xl border border-white/10 bg-[#121618] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent"
            />
          </div>
          <Button
            variant="primary"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Actualizar"}
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
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
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121618] p-4">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-[#E6E9EA]">
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
    </div>
  );
}
