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

function getApiErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.title ||
    error?.message ||
    fallback
  );
}

export default function VentasHistorialPage() {
  const { call } = useApi();
  const router = useRouter();

  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const getDefaultFilters = (): FiltersState => ({
    fechaDesde: toInputDate(primerDiaMes),
    fechaHasta: toInputDate(hoy),
    clienteCodigo: "",
    estado: "",
    totalMin: "",
    totalMax: "",
  });

  const [filters, setFilters] = useState<FiltersState>(getDefaultFilters);
  const [data, setData] = useState<VentaHistorialPageDto | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const buildQueryString = (state: FiltersState, pageToLoad: number) => {
    const qs = new URLSearchParams();

    if (state.fechaDesde) qs.append("FechaDesde", state.fechaDesde);
    if (state.fechaHasta) qs.append("FechaHasta", state.fechaHasta);
    if (state.clienteCodigo.trim()) qs.append("ClienteCodigo", state.clienteCodigo.trim());
    if (state.estado) qs.append("Estado", state.estado);
    if (state.totalMin.trim()) qs.append("TotalMin", state.totalMin.trim());
    if (state.totalMax.trim()) qs.append("TotalMax", state.totalMax.trim());

    qs.append("Page", String(pageToLoad));
    qs.append("PageSize", String(pageSize));

    return qs.toString();
  };

  const validateFilters = (state: FiltersState) => {
    if (state.fechaDesde && state.fechaHasta && state.fechaDesde > state.fechaHasta) {
      return "La fecha desde no puede ser mayor que la fecha hasta.";
    }

    const totalMin = state.totalMin.trim() ? Number(state.totalMin) : null;
    const totalMax = state.totalMax.trim() ? Number(state.totalMax) : null;

    if (totalMin != null && totalMax != null && totalMin > totalMax) {
      return "El total mínimo no puede ser mayor que el total máximo.";
    }

    return null;
  };

  const loadData = async (pageToLoad: number, filtersToUse?: FiltersState) => {
    const currentFilters = filtersToUse ?? filters;
    const validationError = validateFilters(currentFilters);

    if (validationError) {
      setErr(validationError);
      return;
    }

    try {
      setLoading(true);
      setErr(null);

      const url = `/api/ventas/historial?${buildQueryString(currentFilters, pageToLoad)}`;

      const result = await call<VentaHistorialPageDto>(url, {
        method: "GET",
      });

      setData(result ?? null);
      setPage(pageToLoad);
    } catch (e: any) {
      setErr(getApiErrorMessage(e, "No se pudo cargar el historial de ventas."));
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
      setClientes([]);
    }
  };

  useEffect(() => {
    loadData(1, getDefaultFilters()).catch(console.error);
    loadClientes().catch(console.error);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.anulada === "1") {
      setSuccessMsg("La venta fue anulada correctamente.");
    } else {
      setSuccessMsg(null);
    }
  }, [router.isReady, router.query.anulada]);

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
    const reset = getDefaultFilters();
    setFilters(reset);
    setErr(null);
    loadData(1, reset).catch(console.error);
  };

  const handleVerVenta = (ventaID: number) => {
    router.push(`/ventas/${ventaID}`);
  };

  const canPrev = page > 1;
  const canNext = !!data && page < (data.totalPages || 1);

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <header className="mb-5">
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
        subtitle="Consulta, filtra y revisa el detalle de las ventas realizadas."
      />

      {successMsg && (
        <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {successMsg}
        </div>
      )}

      <section className="mb-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.16)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label>Fecha desde</Label>
            <input
              type="date"
              value={filters.fechaDesde}
              onChange={handleFilterChange("fechaDesde")}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0F1416] px-4 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Fecha hasta</Label>
            <input
              type="date"
              value={filters.fechaHasta}
              onChange={handleFilterChange("fechaHasta")}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0F1416] px-4 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Cliente</Label>
            <select
              value={filters.clienteCodigo}
              onChange={handleFilterChange("clienteCodigo")}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0F1416] px-4 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-[#0F1416]" style={{ color: "#ffffff" }}>
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

          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <select
              value={filters.estado}
              onChange={handleFilterChange("estado")}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0F1416] px-4 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-[#0F1416]" style={{ color: "#ffffff" }}>
                Todos
              </option>
              <option value="Registrada" className="bg-[#0F1416]" style={{ color: "#ffffff" }}>
                Registrada
              </option>
              <option value="Anulada" className="bg-[#0F1416]" style={{ color: "#ffffff" }}>
                Anulada
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Total mínimo</Label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={filters.totalMin}
              onChange={handleFilterChange("totalMin")}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0F1416] px-4 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Total máximo</Label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={filters.totalMax}
              onChange={handleFilterChange("totalMax")}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0F1416] px-4 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="primary"
              className="h-12 !rounded-2xl !bg-[#A30862] px-5 hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40"
              onClick={handleBuscar}
            >
              Buscar
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-12 rounded-2xl border border-white/10 bg-transparent px-4 text-sm text-white/75 hover:bg-white/5"
              onClick={handleLimpiar}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </section>

      {loading && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-[#121618] px-4 py-3 text-sm text-[#8B9AA0]">
          Cargando ventas…
        </div>
      )}

      {err && !loading && (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {err}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#13171A] shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <CardTable>
          <thead>
            <tr className="bg-[#1C2224] text-left text-[12px] uppercase tracking-[0.04em] text-[#8B9AA0]">
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
                  <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                    <div className="mb-2 text-sm font-medium text-white/70">
                      No se encontraron ventas
                    </div>
                    <span className="text-xs text-white/35">
                      Ajusta los filtros para intentar nuevamente.
                    </span>
                  </div>
                </Td>
              </tr>
            )}

            {data?.items.map((v) => (
              <tr
                key={v.ventaID}
                className="cursor-pointer hover:bg-white/[0.035]"
                onDoubleClick={() => handleVerVenta(v.ventaID)}
              >
                <Td className="font-medium text-white/90">#{v.ventaID}</Td>
                <Td>{new Date(v.fecha).toLocaleString()}</Td>
                <Td>
                  <div className="flex flex-col">
                    <span className="font-medium text-white/90">{v.clienteNombre}</span>
                    {v.clienteCodigo && (
                      <span className="mt-0.5 text-xs text-white/38">{v.clienteCodigo}</span>
                    )}
                  </div>
                </Td>
                <Td className="text-right">{formatMoney(v.subtotal ?? 0)}</Td>
                <Td className="text-right">{formatMoney(v.descuento ?? 0)}</Td>
                <Td className="text-right font-semibold text-white">
                  {formatMoney(v.total ?? 0)}
                </Td>
                <Td className="text-center">
                  <div className="flex justify-center">
                    {v.estado === "Anulada" ? (
                      <PillBadge variant="danger">Anulada</PillBadge>
                    ) : (
                      <PillBadge variant="success">Registrada</PillBadge>
                    )}
                  </div>
                </Td>
                <Td className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 rounded-2xl border border-white/10 bg-white/5 px-4 text-xs text-white hover:bg-white/10"
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
          <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Página {page} de {data.totalPages} · {data.totalItems} ventas
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-2xl border border-white/10 bg-transparent px-4 text-xs text-white/75 hover:bg-white/5 disabled:opacity-40"
                disabled={!canPrev}
                onClick={() => canPrev && loadData(page - 1)}
              >
                ← Anterior
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-2xl border border-white/10 bg-transparent px-4 text-xs text-white/75 hover:bg-white/5 disabled:opacity-40"
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
    className={["text-xs font-medium tracking-wide text-white/70", className].join(
      " "
    )}
  >
    {children}
  </label>
);