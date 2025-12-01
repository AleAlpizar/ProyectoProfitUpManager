"use client";

import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  CardTable,
  Th,
  Td,
  PageBtn,
  PillBadge,
} from "../../components/ui/table";
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

  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] =
    useState<"Todos" | OrdenEstado>("Todos");

  const [fechaDesde, setFechaDesde] = useState<string>(
    toInputDate(primerDiaMes)
  );
  const [fechaHasta, setFechaHasta] = useState<string>(toInputDate(hoy));

  const pageSize = 10;
  const [page, setPage] = useState(1);

  const [pendingChange, setPendingChange] = useState<{
    id: number;
    nuevoEstado: OrdenEstado;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const qs = new URLSearchParams();
        qs.set("page", "1");
        qs.set("pageSize", "200");

        const data = await call<OrdenCompraHistorialPageDto>(
          `/api/ordenes-compra/historial?${qs.toString()}`,
          { method: "GET" }
        );

        if (!alive) return;
        setRows(data?.items ?? []);
      } catch (e: any) {
        if (!alive) return;
        setErr(
          e?.message ?? "No se pudo obtener el historial de órdenes de compra."
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [call]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    let desdeTs: number | null = null;
    let hastaTs: number | null = null;

    if (fechaDesde) {
      const d = new Date(fechaDesde);
      d.setHours(0, 0, 0, 0);
      desdeTs = d.getTime();
    }

    if (fechaHasta) {
      const d = new Date(fechaHasta);
      d.setHours(23, 59, 59, 999);
      hastaTs = d.getTime();
    }

    return rows.filter((r) => {
      if (estadoFilter !== "Todos" && r.estado !== estadoFilter) return false;

      const fechaRow = new Date(r.fechaSolicitud);
      const fechaTs = fechaRow.getTime();

      if (desdeTs !== null && fechaTs < desdeTs) return false;
      if (hastaTs !== null && fechaTs > hastaTs) return false;

      if (!term) return true;

      const idPretty = `OC-${String(r.ordenCompraID).padStart(4, "0")}`;

      return (
        idPretty.toLowerCase().includes(term) ||
        String(r.ordenCompraID).includes(term) ||
        r.proveedorNombre.toLowerCase().includes(term) ||
        r.estado.toLowerCase().includes(term)
      );
    });
  }, [rows, q, estadoFilter, fechaDesde, fechaHasta]);

  useEffect(
    () => setPage(1),
    [q, estadoFilter, fechaDesde, fechaHasta]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

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
      await call(`/api/ordenes-compra/${id}/estado`, {
        method: "PUT",
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      setRows((prev) =>
        prev.map((r) =>
          r.ordenCompraID === id ? { ...r, estado: nuevoEstado } : r
        )
      );
    } catch (e: any) {
      setErr(
        e?.message ?? "No se pudo actualizar el estado de la orden de compra."
      );
    } finally {
      setPendingChange(null);
    }
  };

  const renderEstado = (r: OrdenCompraRow) => {
    if (r.estado === "Pendiente") {
      return (
        <select
          value={r.estado}
          onChange={(e) =>
            solicitarCambioEstado(r, e.target.value as OrdenEstado)
          }
          className="
            rounded-full border border-amber-400/60
            bg-black text-white
            px-3 py-1 text-xs font-medium
            outline-none
            focus:border-transparent focus:ring-2 focus:ring-amber-400/80
            appearance-none
          "
          style={{ colorScheme: "dark" }}
        >
          <option className="bg-black text-white" value="Pendiente">
            Pendiente
          </option>
          <option className="bg-black text-white" value="Hecha">
            Hecha
          </option>
          <option className="bg-black text-white" value="Anulada">
            Anulada
          </option>
        </select>
      );
    }

    if (r.estado === "Hecha") {
      return <PillBadge variant="success">Hecha</PillBadge>;
    }

    return <PillBadge variant="danger">Anulada</PillBadge>;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-6 py-4 md:py-6">
      <SectionHeader
        title="Órdenes de compra"
        subtitle="Consulta, registra y gestiona el estado de las órdenes de compra a proveedores"
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por #, proveedor o estado"
              className="w-full rounded-xl border border-white/10 bg-[#121618] pl-9 pr-3 py-2 text-sm outline-none placeholder:text-[#8B9AA0] focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent transition"
            />
            <svg
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
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

          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value as any)}
            className="w-full max-w-[180px] rounded-xl border border-white/10 bg-[#121618] px-3 py-2 text-sm outline-none text-[#E6E9EA] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Hecha">Hechas</option>
            <option value="Anulada">Anuladas</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center rounded-xl bg-[#A30862] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
            onClick={() => router.push("/compras/registrar")}
          >
            + Nueva orden
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:max-w-xl">
        <div className="flex flex-col gap-1">
          <label className="mb-1 block text-xs font-medium text-white/70">
            Fecha desde
          </label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#121618] px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="mb-1 block text-xs font-medium text-white/70">
            Fecha hasta
          </label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#121618] px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      {err && (
        <div className="mb-3 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-3 text-xs text-rose-100">
          {err}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#121618] p-4 text-sm text-[#8B9AA0]">
          Cargando…
        </div>
      ) : (
        <>
          <CardTable>
            <thead>
              <tr className="bg-[#1C2224]">
                <Th>#</Th>
                <Th>Proveedor</Th>
                <Th>Fecha solicitud</Th>
                <Th>Estado</Th>
                <Th>Total</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>

            <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
              {pageRows.map((r) => (
                <tr key={r.ordenCompraID} className="hover:bg-white/5">
                  <Td strong>
                    <button
                      type="button"
                      className="underline-offset-2 hover:underline"
                      onClick={() => router.push(`/compras/${r.ordenCompraID}`)}
                    >
                      {prettyId(r.ordenCompraID)}
                    </button>
                  </Td>
                  <Td>{r.proveedorNombre}</Td>
                  <Td>
                    {new Date(r.fechaSolicitud).toLocaleDateString("es-CR")}
                  </Td>
                  <Td>{renderEstado(r)}</Td>
                  <Td>{formatMoney(r.total)}</Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-xl border border-white/20 bg-transparent px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
                      onClick={() => router.push(`/compras/${r.ordenCompraID}`)}
                    >
                      Ver detalle
                    </button>
                  </Td>
                </tr>
              ))}

              {pageRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-[#8B9AA0]"
                  >
                    No hay órdenes de compra registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </CardTable>

          <div className="mt-4 flex items-center justify-between text-sm text-[#8B9AA0]">
            <span>
              Mostrando{" "}
              <b className="text-white">
                {pageRows.length === 0 ? 0 : (page - 1) * pageSize + 1}-
                {(page - 1) * pageSize + pageRows.length}
              </b>{" "}
              de <b className="text-white">{filtered.length}</b>
            </span>
            <div className="flex items-center gap-2">
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
              )} a "${pendingChange.nuevoEstado}"? 
Este cambio no es reversible. Solo las órdenes en estado Pendiente pueden modificarse.`
            : ""
        }
        confirmText="Sí, cambiar estado"
        onClose={() => setPendingChange(null)}
        onConfirm={aplicarCambioEstado}
      />
    </div>
  );
}
