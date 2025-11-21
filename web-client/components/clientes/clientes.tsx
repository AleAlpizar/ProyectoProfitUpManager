"use client";

import React, { useEffect } from "react";
import Button from "../buttons/button";
import { Cliente, Estado } from "./types";
import ClientForm from "./ClientForm";
import Modal from "../modals/Modal";
import { useApi } from "../hooks/useApi";
import { useConfirm } from "../modals/ConfirmProvider";

import { CardTable, Th, Td, PageBtn, PillBadge } from "../ui/table";
import ClienteDetails from "./ClienteDetails";

export default function ClientesPage() {
  const [rows, setRows] = React.useState<Cliente[]>([]);
  const { call } = useApi();
  const [q, setQ] = React.useState("");
  const [filterEstado, setFilterEstado] = React.useState<"Todos" | Estado>("Todos");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const [formOpen, setFormOpen] = React.useState(false);
  const [edit, setEdit] = React.useState<Cliente | null>(null);
  const [view, setView] = React.useState<Cliente | null>(null);

  const confirm = useConfirm();

  const fetchClientData = async () => {
    const data = await call<Cliente[]>(`/api/clientes`, { method: "GET" });
    if (data) setRows(data);
  };

  useEffect(() => {
    fetchClientData().catch(console.error);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", formOpen || !!view);
  }, [formOpen, view]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !term ||
        r.nombre.toLowerCase().includes(term) ||
        (r.correo ?? "").toLowerCase().includes(term);

      const matchEstado =
        filterEstado === "Todos"
          ? true
          : (r.isActive ? "Activo" : "Inactivo") === filterEstado;

      return matchQ && matchEstado;
    });
  }, [rows, q, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  React.useEffect(() => {
    setPage(1);
  }, [q, filterEstado]);

  const onSaveCliente = async (payload: Cliente) => {
    await call<Cliente>(`/api/clientes${edit ? `/${payload.clienteID}` : ""}`, {
      method: edit ? "PUT" : "POST",
      body: JSON.stringify(payload),
    }).catch(console.error);

    setFormOpen(false);
    setEdit(null);
    await fetchClientData();
  };

  const toggleEstado = async (r: Cliente) => {
    const toAct = !r.isActive;

    const ok = await confirm({
      title: toAct ? "Reactivar cliente" : "Inactivar cliente",
      message: <>¿Confirmas {toAct ? "reactivar" : "inactivar"} al cliente <b>{r.nombre}</b>?</>,
      tone: toAct ? "brand" : "danger",
      confirmText: toAct ? "Reactivar" : "Inactivar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    await call<{ clienteID: number; isActive: boolean }>(
      `/api/clientes/${r.clienteID}/activo`,
      { method: "PATCH", body: JSON.stringify({ isActive: toAct }) }
    ).catch(console.error);

    await fetchClientData();
  };

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#E6E9EA] p-6">
      <header className="mb-6">
        {/* Breadcrumb */}
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
              <path d="M8 4a3 3 0 1 1-3 3 3 3 0 0 1 3-3Zm8 0a3 3 0 1 1-3 3 3 3 0 0 1 3-3ZM4 14.25A3.25 3.25 0 0 1 7.25 11h1.5A3.25 3.25 0 0 1 12 14.25V18H4Zm9.75-3.25h1.5A3.25 3.25 0 0 1 18.5 14.25V18h-8v-3.75A3.25 3.25 0 0 1 13.75 11Z" />
            </svg>
            <span>Clientes</span>
          </div>
        </nav>

        <h1 className="text-2xl font-semibold tracking-wide">Clientes</h1>
        <p className="text-sm text-[#8B9AA0]">
          Registrar, editar, inactivar y administrar descuentos
        </p>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o correo"
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
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-[#121618] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent transition"
          >
            <option value="Todos">Todos</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </select>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => {
              setEdit(null);
              setFormOpen(true);
            }}
          >
            Nuevo cliente
          </Button>
        </div>
      </div>

      <CardTable>
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
              <Td>
                <div className="font-medium">{r.nombre}</div>
              </Td>
              <Td className="text-[#8B9AA0]">{r.correo}</Td>
              <Td>
                <PillBadge variant={r.isActive ? "success" : "danger"}>
                  {r.isActive ? "Activo" : "Inactivo"}
                </PillBadge>
              </Td>
              <Td className="text-right">
                <div className="inline-flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setView(r)}
                    className="!rounded-xl !border-white/20 !bg-transparent hover:!bg-white/5"
                  >
                    Ver
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEdit(r);
                      setFormOpen(true);
                    }}
                    className="!rounded-xl !border-white/20 !bg-white/5 hover:!bg-white/10"
                  >
                    Editar
                  </Button>
                  <Button variant="danger" onClick={() => toggleEstado(r)}>
                    {r.isActive ? "Inactivar" : "Reactivar"}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}

          {pageRows.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-10 text-center text-sm text-[#8B9AA0]"
              >
                No hay clientes para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </CardTable>

      {formOpen && (
        <Modal
          frameless
          onClose={() => {
            setFormOpen(false);
            setEdit(null);
          }}
        >
          <ClientForm
            initial={edit ?? undefined}
            onCancel={() => {
              setFormOpen(false);
              setEdit(null);
            }}
            onSave={onSaveCliente}
          />
        </Modal>
      )}

      {view && (
        <Modal
          frameless
          onClose={() => {
            setView(null);
          }}
        >
          <ClienteDetails
            cliente={view}
            onClose={() => {
              setView(null);
            }}
          />
        </Modal>
      )}

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
    </div>
  );
}
