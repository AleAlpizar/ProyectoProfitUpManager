"use client";

import React, { useEffect, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import Button from "@/components/buttons/button";
import { useApi } from "@/components/hooks/useApi";
import { formatMoney } from "@/helpers/ui-helpers";
import { useRouter } from "next/router";
import { CardTable, Th, Td, PillBadge } from "@/components/ui/table";
import { Cliente } from "@/components/clientes/types";

type EstadoVenta = "Registrada" | "Anulada";

type VentaHistorialListItemDto = {
  ventaID: number;
  fecha: string;
  clienteID?: number | null;
  clienteNombre: string;
  clienteCodigo: string;
  subtotal: number;
  descuento: number;
  total: number;
  estado: EstadoVenta;
};

type VentaHistorialPageDto = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: VentaHistorialListItemDto[];
};

type FiltersState = {
  fechaDesde: string;
  fechaHasta: string;
  clienteCodigo: string;
  estado: "" | EstadoVenta;
  totalMin: string;
  totalMax: string;
};

function toInputDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function VentasHistorialPage() {
  const { call } = useApi();
  const router = useRouter();

  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const [filters, setFilters] = useState<FiltersState>({
    fechaDesde: toInputDate(primerDiaMes),
    fechaHasta: toInputDate(hoy),
    clienteCodigo: "",
    estado: "",
    totalMin: "",
    totalMax: "",
  });

  const [data, setData] = useState<VentaHistorialPageDto | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const loadData = async (pageToLoad: number) => {
    try {
      setLoading(true);
      setErr(null);

      const qs = new URLSearchParams();

      if (filters.fechaDesde) qs.append("FechaDesde", filters.fechaDesde);
      if (filters.fechaHasta) qs.append("FechaHasta", filters.fechaHasta);
      if (filters.clienteCodigo.trim())
        qs.append("ClienteCodigo", filters.clienteCodigo.trim());
      if (filters.estado) qs.append("Estado", filters.estado);

      if (filters.totalMin.trim())
        qs.append("TotalMin", filters.totalMin.trim());
      if (filters.totalMax.trim())
        qs.append("TotalMax", filters.totalMax.trim());

      qs.append("Page", String(pageToLoad));
      qs.append("PageSize", String(pageSize));

      const url = `/api/ventas/historial?${qs.toString()}`;

      const result = await call<VentaHistorialPageDto>(url, {
        method: "GET",
      });
      setData(result ?? null);
      setPage(pageToLoad);
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo cargar el historial de ventas.");
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const result = await call<Cliente[]>("/api/clientes", {
        method: "GET",
      });
      setClientes(result ?? []);
    } catch {
    }
  };

  useEffect(() => {
    loadData(1).catch(console.error);
    loadClientes().catch(console.error);
  }, []);

  const handleFilterChange =
    (field: keyof FiltersState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setFilters((prev) => ({ ...prev, [field]: value }));
    };

  const handleBuscar = () => {
    loadData(1).catch(console.error);
  };

  const handleLimpiar = () => {
    setFilters({
      fechaDesde: toInputDate(primerDiaMes),
      fechaHasta: toInputDate(hoy),
      clienteCodigo: "",
      estado: "",
      totalMin: "",
      totalMax: "",
    });
    loadData(1).catch(console.error);
  };

  const handleVerVenta = (ventaID: number) => {
    router.push(`/ventas/${ventaID}`);
  };

  const canPrev = page > 1;
  const canNext = data && page < (data.totalPages || 1);

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <header className="mb-4">
        <nav className="mb-3 flex items-center text-sm text-[#8B9AA0]">
          <div className="flex items-center gap-1">
            <svg
              className="h-4 w-4 opacity-80"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M3 10.25 12 3l9 7.25V21a1 1 0 0 1-1 1h-5.5v-6.5h-5V22H4a1 1 0 0 1-1-1v-10.75Z" />
            </svg>
            <span>Inicio</span>
          </div>

          <span className="mx-2 text-[#4B5563]">/</span>

          <div className="flex items-center gap-1 text-white">
            <svg
              className="h-4 w-4 opacity-80"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M5 4h14a1 1 0 0 1 1 1v3H4V5a1 1 0 0 1-1-1Zm-1 6h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
            </svg>
            <span>Ventas</span>
          </div>

          <span className="mx-2 text-[#4B5563]">/</span>

          <span className="text-white">Historial</span>
        </nav>
      </header>

      <SectionHeader
        title="Historial de ventas"
        subtitle="Consulta y filtra las ventas realizadas."
      />

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <Label>Fecha desde</Label>
            <input
              type="date"
              value={filters.fechaDesde}
              onChange={handleFilterChange("fechaDesde")}
              className="w-full rounded-xl border border-white/10 bg-[#0F1416] px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Fecha hasta</Label>
            <input
              type="date"
              value={filters.fechaHasta}
              onChange={handleFilterChange("fechaHasta")}
              className="w-full rounded-xl border border-white/10 bg-[#0F1416] px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Cliente</Label>
            <select
              value={filters.clienteCodigo}
              onChange={handleFilterChange("clienteCodigo")}
              className="w-full rounded-xl border border-white/10 bg-[#0F1416] px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            >
              <option
                value=""
                className="bg-[#0F1416]"
                style={{ color: "#ffffff" }}
              >
                Todos los clientes
              </option>
              {clientes.map((c) => (
                <option
                  key={c.clienteID}
                  value={c.codigoCliente ?? ""}
                  className="bg-[#0F1416]"
                  style={{ color: "#ffffff" }}
                >
                  {c.nombre} · {c.codigoCliente}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Estado</Label>
            <select
              value={filters.estado}
              onChange={handleFilterChange("estado")}
              className="w-full rounded-xl border border-white/10 bg-[#0F1416] px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            >
              <option
                value=""
                className="bg-[#0F1416]"
                style={{ color: "#ffffff" }}
              >
                Todos
              </option>
              <option
                value="Registrada"
                className="bg-[#0F1416]"
                style={{ color: "#ffffff" }}
              >
                Registrada
              </option>
              <option
                value="Anulada"
                className="bg-[#0F1416]"
                style={{ color: "#ffffff" }}
              >
                Anulada
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label>Total mínimo</Label>
            <input
              type="number"
              min={0}
              value={filters.totalMin}
              onChange={handleFilterChange("totalMin")}
              className="w-full rounded-xl border border-white/10 bg-[#0F1416] px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Total máximo</Label>
            <input
              type="number"
              min={0}
              value={filters.totalMax}
              onChange={handleFilterChange("totalMax")}
              className="w-full rounded-xl border border-white/10 bg-[#0F1416] px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>
          <div className="flex items-end justify-start gap-2">
            <Button
              type="button"
              variant="primary"
              className="!bg-[#A30862] hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40"
              onClick={handleBuscar}
            >
              Buscar
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="border border-white/10 bg-transparent text-xs text-white/70 hover:bg-white/5"
              onClick={handleLimpiar}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </section>

      {loading && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-[#121618] p-4 text-sm text-[#8B9AA0]">
          Cargando ventas…
        </div>
      )}

      {err && !loading && (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
          {err}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#13171A]">
        <CardTable>
          <thead>
            <tr className="bg-[#1C2224] text-left text-xs uppercase tracking-wide text-[#8B9AA0]">
              <Th># Venta</Th>
              <Th>Fecha</Th>
              <Th>Cliente</Th>
              <Th className="text-right">Subtotal</Th>
              <Th className="text-right">Descuento</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-center">Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
            {!loading && data && data.items.length === 0 && (
              <tr>
                <Td colSpan={8}>
                  <span className="text-xs text-white/40">
                    No se encontraron ventas con los filtros seleccionados.
                  </span>
                </Td>
              </tr>
            )}

            {data?.items.map((v) => (
              <tr
                key={v.ventaID}
                className="hover:bg-white/5 cursor-pointer"
                onDoubleClick={() => handleVerVenta(v.ventaID)}
              >
                <Td>#{v.ventaID}</Td>
                <Td>{new Date(v.fecha).toLocaleString()}</Td>
                <Td>
                  <div className="flex flex-col">
                    <span className="text-white/90">{v.clienteNombre}</span>
                    {v.clienteCodigo && (
                      <span className="text-xs text-white/40">
                        {v.clienteCodigo}
                      </span>
                    )}
                  </div>
                </Td>
                <Td className="text-right">
                  {formatMoney(v.subtotal ?? 0)}
                </Td>
                <Td className="text-right">
                  {formatMoney(v.descuento ?? 0)}
                </Td>
                <Td className="text-right font-semibold text-white">
                  {formatMoney(v.total ?? 0)}
                </Td>
                <Td className="text-center">
                  {v.estado === "Anulada" ? (
                    <PillBadge variant="danger">Anulada</PillBadge>
                  ) : (
                    <PillBadge variant="success">Registrada</PillBadge>
                  )}
                </Td>
                <Td className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    className="border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10"
                    onClick={() => handleVerVenta(v.ventaID)}
                  >
                    Ver detalle
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </CardTable>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/60">
            <span>
              Página {page} de {data.totalPages} · {data.totalItems} ventas
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="border border-white/10 bg-transparent text-xs text-white/70 hover:bg-white/5 disabled:opacity-40"
                disabled={!canPrev}
                onClick={() => canPrev && loadData(page - 1)}
              >
                ← Anterior
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="border border-white/10 bg-transparent text-xs text-white/70 hover:bg-white/5 disabled:opacity-40"
                disabled={!canNext}
                onClick={() => canNext && loadData(page + 1)}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const Label: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <label
    className={["mb-1 block text-xs font-medium text-white/70", className].join(
      " "
    )}
  >
    {children}
  </label>
);
