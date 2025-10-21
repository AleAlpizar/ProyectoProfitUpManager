"use client";

import React, { useEffect } from "react";
import Button from "../buttons/button";
import { Cliente, Estado } from "./types";
import ClientForm from "./ClientForm";
import Modal from "../modals/Modal";
import { useApi } from "../hooks/useApi";

export default function ClientesPage() {
  const [rows, setRows] = React.useState<Cliente[]>([]);
  const { call } = useApi();
  const [q, setQ] = React.useState("");
  const [filterEstado, setFilterEstado] = React.useState<"Todos" | Estado>("Todos");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  // Modales
  const [formOpen, setFormOpen] = React.useState(false);
  const [edit, setEdit] = React.useState<Cliente | null>(null);

  const [confirm, setConfirm] = React.useState<{ id: string; to: Estado } | null>(null);

  const fetchClientData = async () => {
    const data = await call<Cliente[]>(`/api/clientes`, { method: "GET" });
    if (data) setRows(data);
  };

  // Cargar Datos iniciales
  useEffect(() => { fetchClientData().catch(console.error); }, []);

  // Bloquear scroll al abrir modales
  useEffect(() => {
    const any = formOpen || !!confirm;
    document.body.classList.toggle("overflow-hidden", any);
  }, [formOpen, confirm]);

  // Derivados
  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !term ||
        r.nombre.toLowerCase().includes(term) ||
        r.correo.toLowerCase().includes(term);

      const matchEstado =
        filterEstado === "Todos"
          ? true
          : (r.isActive ? "Activo" : "Inactivo") === filterEstado; // <- fix

      return matchQ && matchEstado;
    });
  }, [rows, q, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  React.useEffect(() => { setPage(1); }, [q, filterEstado]);

  // Handlers
  const onSaveCliente = async (payload: Cliente) => {
    await call<Cliente>(`/api/clientes${edit ? `/${payload.clienteID}` : ""}`, {
      method: edit ? "PUT" : "POST",
      body: JSON.stringify(payload),
    }).catch(console.error);
    setFormOpen(false);
    setEdit(null);
    await fetchClientData();
  };

  const onConfirmEstado = async () => {
    if (!confirm) return;
    const data = await call<{ clienteID: number; isActive: boolean }>(
      `/api/clientes/${confirm.id}/activo`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive: confirm.to === "Activo" }),
      }
    ).catch(console.error);
    if (data) await fetchClientData();
    setConfirm(null);
  };

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#E6E9EA] p-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-wide">Clientes</h1>
        <p className="text-sm text-[#8B9AA0]">
          Registrar, editar, inactivar y administrar descuentos
        </p>
      </header>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative w-full max-w-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o correo"
              className="w-full rounded-xl border border-white/10 bg-[#121618] pl-9 pr-3 py-2 text-sm outline-none
                         placeholder:text-[#8B9AA0] focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent transition"
            />
            <svg
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="m21 21-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
            </svg>
          </div>

          {/* Estado */}
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-[#121618] px-3 py-2 text-sm outline-none
                       focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent transition"
          >
            <option value="Todos">Todos</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </select>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => { setEdit(null); setFormOpen(true); }}
          >
            + Nuevo cliente
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121618] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#1C2224]">
              <Th>#</Th>
              <Th>Cliente</Th>
              <Th>Email</Th>
              <Th>Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
            {pageRows.map((r) => (
              <tr key={r.clienteID ?? ""} className="hover:bg-white/5 transition">
                <Td strong>{r.codigoCliente}</Td>
                <Td><div className="font-medium">{r.nombre}</div></Td>
                <Td className="text-[#8B9AA0]">{r.correo}</Td>
                <Td>
                  <Badge tone={r.isActive ? "success" : "danger"}>
                    {r.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => { setEdit(r); setFormOpen(true); }}
                      className="!rounded-xl !border-white/20 !bg-white/5 hover:!bg-white/10"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() =>
                        setConfirm({
                          id: r.clienteID?.toString() ?? "",
                          to: r.isActive ? "Inactivo" : "Activo",
                        })
                      }
                    >
                      {r.isActive ? "Inactivar" : "Reactivar"}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}

            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#8B9AA0]">
                  No hay clientes para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      {formOpen && (
        <Modal onClose={() => { setFormOpen(false); setEdit(null); }}>
          <ClientForm
            initial={edit ?? undefined}
            onCancel={() => { setFormOpen(false); setEdit(null); }}
            onSave={onSaveCliente}
          />
        </Modal>
      )}

      {confirm && (
        <Modal onClose={() => setConfirm(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121618] p-5 text-[#E6E9EA] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold mb-2">Cambiar estado</h2>
            <p className="text-sm text-[#8B9AA0] mb-4">
              ¿Confirmas {confirm.to === "Activo" ? "reactivar" : "inactivar"} al cliente
              {" "}<b>{confirm.id}</b>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirm(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={onConfirmEstado}>
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between text-sm text-[#8B9AA0]">
        <span>
          Mostrando{" "}
          <b className="text-white">
            {pageRows.length === 0 ? 0 : (page - 1) * pageSize + 1}-{(page - 1) * pageSize + pageRows.length}
          </b>{" "}
          de <b className="text-white">{filtered.length}</b>
        </span>
        <div className="flex items-center gap-2">
          <PageBtn disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</PageBtn>
          <span> Página <b className="text-white">{page}</b> de <b className="text-white">{totalPages}</b> </span>
          <PageBtn disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</PageBtn>
        </div>
      </div>
    </div>
  );
}

/* ---------- Presentational helpers (dark-first) ---------- */

const Badge: React.FC<React.PropsWithChildren<{ tone?: "success" | "danger" | "default" }>> = ({
  tone = "default",
  children,
}) => {
  const map: Record<string, string> = {
    success: "bg-[#95B64F]/18 text-[#95B64F] border-[#95B64F]/35",
    danger: "bg-[#6C0F1C]/20 text-[#F7C6CF] border-[#6C0F1C]/40",
    default: "bg-white/5 text-[#8B9AA0] border-white/10",
  };
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        map[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
};

const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <th
    className={[
      "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8B9AA0]",
      className,
    ].join(" ")}
  >
    {children}
  </th>
);

const Td: React.FC<React.PropsWithChildren<{ className?: string; strong?: boolean }>> = ({
  className = "",
  strong = false,
  children,
}) => (
  <td
    className={[
      "px-3 py-2 text-sm",
      strong ? "font-semibold text-white" : "text-[#E6E9EA]",
      className,
    ].join(" ")}
  >
    {children}
  </td>
);

const PageBtn: React.FC<React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>> = ({
  className = "",
  children,
  ...props
}) => (
  <button
    className={[
      "rounded-xl px-3 py-1 text-sm transition",
      "bg-[#1C2224] text-white hover:bg-white/10",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "focus:outline-none focus:ring-2 focus:ring-[#A30862]/40",
      className,
    ].join(" ")}
    {...props}
  >
    {children}
  </button>
);
