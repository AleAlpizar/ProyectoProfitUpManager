"use client";

import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import { CardTable, Th, Td, PageBtn } from "../../components/ui/table";
import { useApi } from "@/components/hooks/useApi";
import { formatMoney } from "@/helpers/ui-helpers";
import { useRouter } from "next/router";

type OrdenEstado = "Pendiente" | "Hecha" | "Anulada";

type OrdenCompraRow = {
  ordenCompraID: number;
  fechaSolicitud: string;
  proveedorID: number;
  proveedorNombre: string;
  total: number;
  estado: OrdenEstado;
};

type OrdenCompraHistorialPageDto = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: OrdenCompraRow[];
};

function toInputDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function OrdenesComprasHistorialPage() {
  const router = useRouter();
  const { call } = useApi();

  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const [rows, setRows] = useState<OrdenCompraRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] =
    useState<"Todos" | OrdenEstado>("Todos");

  const [fechaDesde, setFechaDesde] = useState<string>(
    toInputDate(primerDiaMes)
  );
  const [fechaHasta, setFechaHasta] = useState<string>(toInputDate(hoy));

  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [pendingChange, setPendingChange] = useState<{
    id: number;
    nuevoEstado: OrdenEstado;
  } | null>(null);

  const [changingStateId, setChangingStateId] = useState<number | null>(null);

  const dateRangeError = useMemo(() => {
    if (!fechaDesde || !fechaHasta) return null;
    if (fechaDesde > fechaHasta) {
      return "La fecha desde no puede ser mayor que la fecha hasta.";
    }
    return null;
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    setPage(1);
  }, [q, estadoFilter, fechaDesde, fechaHasta]);

  useEffect(() => {
    let alive = true;

    if (dateRangeError) {
      setErr(dateRangeError);
      setRows([]);
      setTotalItems(0);
      setTotalPages(1);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const qs = new URLSearchParams();
        qs.set("page", String(page));
        qs.set("pageSize", String(pageSize));

        if (fechaDesde) qs.set("fechaDesde", fechaDesde);
        if (fechaHasta) qs.set("fechaHasta", fechaHasta);
        if (estadoFilter !== "Todos") qs.set("estado", estadoFilter);

        const term = q.trim();
        if (term) {
          const numericId = Number(term);
          if (!Number.isNaN(numericId) && numericId > 0 && /^\d+$/.test(term)) {
            qs.set("ordenCompraID", String(numericId));
          } else {
            qs.set("proveedorNombre", term);
          }
        }

        const data = await call<OrdenCompraHistorialPageDto>(
          `/api/ordenes-compra/historial?${qs.toString()}`,
          { method: "GET" }
        );

        if (!alive) return;

        setRows(data?.items ?? []);
        setTotalItems(data?.totalItems ?? 0);
        setTotalPages(Math.max(1, data?.totalPages ?? 1));
      } catch (e: any) {
        if (!alive) return;
        setErr(
          e?.message ?? "No se pudo obtener el historial de órdenes de compra."
        );
        setRows([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    call,
    page,
    pageSize,
    q,
    estadoFilter,
    fechaDesde,
    fechaHasta,
    dateRangeError,
  ]);

  const prettyId = (id: number) => `OC-${String(id).padStart(4, "0")}`;

  const solicitarCambioEstado = (
    row: OrdenCompraRow,
    nuevoEstado: OrdenEstado
  ) => {
    if (row.estado !== "Pendiente") return;
    if (row.estado === nuevoEstado) return;

    setPendingChange({ id: row.ordenCompraID, nuevoEstado });
  };

  const aplicarCambioEstado = async () => {
    if (!pendingChange) return;

    const { id, nuevoEstado } = pendingChange;

    try {
      setChangingStateId(id);
      setErr(null);
      setSuccessMsg(null);

      const res = await call<{ message?: string; estado?: OrdenEstado }>(
        `/api/ordenes-compra/${id}/estado`,
        {
          method: "PUT",
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      setRows((prev) =>
        prev.map((r) =>
          r.ordenCompraID === id
            ? { ...r, estado: (res?.estado as OrdenEstado) ?? nuevoEstado }
            : r
        )
      );

      setSuccessMsg(
        res?.message ?? "El estado de la orden fue actualizado correctamente."
      );
    } catch (e: any) {
      setErr(
        e?.message ?? "No se pudo actualizar el estado de la orden de compra."
      );
    } finally {
      setChangingStateId(null);
      setPendingChange(null);
    }
  };

  const renderEstado = (r: OrdenCompraRow) => {
    const badgeBase =
      "inline-flex min-w-[124px] justify-center rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm";

    if (r.estado === "Pendiente") {
      return (
        <div className="inline-flex items-center">
          <select
            value={r.estado}
            disabled={changingStateId === r.ordenCompraID}
            onChange={(e) =>
              solicitarCambioEstado(r, e.target.value as OrdenEstado)
            }
            className={`${badgeBase} border-amber-400/70 bg-[#0F1115] text-center text-white outline-none transition appearance-none focus:border-transparent focus:ring-2 focus:ring-amber-400/80 disabled:cursor-not-allowed disabled:opacity-60`}
            style={{ colorScheme: "dark" }}
          >
            <option className="bg-[#0F1115] text-white" value="Pendiente">
              Pendiente
            </option>
            <option className="bg-[#0F1115] text-white" value="Hecha">
              Hecha
            </option>
            <option className="bg-[#0F1115] text-white" value="Anulada">
              Anulada
            </option>
          </select>
        </div>
      );
    }

    if (r.estado === "Hecha") {
      return (
        <span
          className={`${badgeBase} border-lime-400/45 bg-lime-400/10 text-lime-300`}
        >
          Hecha
        </span>
      );
    }

    return (
      <span
        className={`${badgeBase} border-rose-400/45 bg-rose-400/10 text-rose-300`}
      >
        Anulada
      </span>
    );
  };

  const showingFrom = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = totalItems === 0 ? 0 : (page - 1) * pageSize + rows.length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-7">
      <div className="mb-5">
        <SectionHeader
          title="Órdenes de compra"
          subtitle="Consulta, registra y gestiona el estado de las órdenes de compra a proveedores"
        />
      </div>

      <section className="mb-5 rounded-3xl border border-white/10 bg-[#13171A] p-4 shadow-[0_18px_50px_rgba(0,0,0,.28)] md:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative w-full lg:max-w-md">
                <label className="mb-1.5 block text-xs font-medium text-white/65">
                  Buscar
                </label>
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setSuccessMsg(null);
                  }}
                  placeholder="Buscar por número de orden o proveedor"
                  className="w-full rounded-2xl border border-white/10 bg-[#121618] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-[#8B9AA0] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
                />
                <svg
                  className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 -translate-y-1/2 text-white/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m21 21-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                  />
                </svg>
              </div>

              <div className="w-full lg:max-w-[190px]">
                <label className="mb-1.5 block text-xs font-medium text-white/65">
                  Estado
                </label>
                <select
                  value={estadoFilter}
                  onChange={(e) => {
                    setEstadoFilter(e.target.value as "Todos" | OrdenEstado);
                    setSuccessMsg(null);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-[#121618] px-3 py-2.5 text-sm text-[#E6E9EA] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
                >
                  <option value="Todos">Todos</option>
                  <option value="Pendiente">Pendientes</option>
                  <option value="Hecha">Hechas</option>
                  <option value="Anulada">Anuladas</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center rounded-2xl bg-[#A30862] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-[1px] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
                onClick={() => router.push("/compras/registrar")}
              >
                + Nueva orden
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/65">
                Fecha desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  setSuccessMsg(null);
                }}
                className="w-full rounded-2xl border border-white/10 bg-[#121618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/65">
                Fecha hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  setSuccessMsg(null);
                }}
                className="w-full rounded-2xl border border-white/10 bg-[#121618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>
        </div>
      </section>

      {successMsg && (
        <div className="mb-4 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 shadow-sm">
          {successMsg}
        </div>
      )}

      {err && (
        <div className="mb-4 rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 shadow-sm">
          {err}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-[#13171A] p-6 text-sm text-[#8B9AA0] shadow-[0_18px_50px_rgba(0,0,0,.22)]">
          Cargando…
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#13171A] shadow-[0_18px_50px_rgba(0,0,0,.22)]">
            <CardTable>
              <thead>
                <tr className="bg-[#1B2025]">
                  <Th>#</Th>
                  <Th>Proveedor</Th>
                  <Th>Fecha solicitud</Th>
                  <Th>Estado</Th>
                  <Th>Total</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>

              <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
                {rows.map((r) => (
                  <tr
                    key={r.ordenCompraID}
                    className="transition hover:bg-white/[0.04]"
                  >
                    <Td strong>
                      <button
                        type="button"
                        className="font-medium text-white underline-offset-4 transition hover:text-[#F472B6] hover:underline"
                        onClick={() =>
                          router.push(`/compras/${r.ordenCompraID}`)
                        }
                      >
                        {prettyId(r.ordenCompraID)}
                      </button>
                    </Td>

                    <Td>
                      <div className="max-w-[260px] truncate text-white/90">
                        {r.proveedorNombre}
                      </div>
                    </Td>

                    <Td>
                      <span className="text-white/85">
                        {new Date(r.fechaSolicitud).toLocaleDateString("es-CR")}
                      </span>
                    </Td>

                    <Td>{renderEstado(r)}</Td>

                    <Td>
                      <span className="font-semibold text-white">
                        {formatMoney(r.total)}
                      </span>
                    </Td>

                    <Td className="text-right">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
                        onClick={() =>
                          router.push(`/compras/${r.ordenCompraID}`)
                        }
                      >
                        Ver detalle
                      </button>
                    </Td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-14 text-center text-sm text-[#8B9AA0]"
                    >
                      <div className="mx-auto max-w-md">
                        <div className="mb-1 text-base font-medium text-white/85">
                          Sin resultados
                        </div>
                        <div>
                          {q ||
                          estadoFilter !== "Todos" ||
                          fechaDesde ||
                          fechaHasta
                            ? "No se encontraron órdenes de compra con los filtros indicados."
                            : "No hay órdenes de compra registradas."}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </CardTable>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#13171A] px-4 py-3 text-sm text-[#8B9AA0] sm:flex-row sm:items-center sm:justify-between">
            <span>
              Mostrando{" "}
              <b className="text-white">
                {showingFrom}-{showingTo}
              </b>{" "}
              de <b className="text-white">{totalItems}</b>
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <PageBtn
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </PageBtn>
              <span>
                Página <b className="text-white">{page}</b> de{" "}
                <b className="text-white">{totalPages}</b>
              </span>
              <PageBtn
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </PageBtn>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!pendingChange}
        title="Cambiar estado de la orden"
        message={
          pendingChange
            ? `¿Confirmas cambiar el estado de la orden ${prettyId(
                pendingChange.id
              )} a "${pendingChange.nuevoEstado}"?\nEste cambio no es reversible. Solo las órdenes en estado Pendiente pueden modificarse.`
            : ""
        }
        confirmText="Sí, cambiar estado"
        onClose={() => setPendingChange(null)}
        onConfirm={aplicarCambioEstado}
      />
    </div>
  );
}