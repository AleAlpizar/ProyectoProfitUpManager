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

type ApiEstadoResponse = {
  clienteID: number;
  isActive: boolean;
  updatedAt?: string | null;
  updatedBy?: number | null;
  message?: string;
};

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
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const confirm = useConfirm();

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const data = await call<Cliente[]>(`/api/clientes`, { method: "GET" });
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudieron cargar los clientes.";
      setFeedback({ type: "error", text: message });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData().catch(() => undefined);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", formOpen || !!view);

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [formOpen, view]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();

    return rows.filter((r) => {
      const matchQ =
        !term ||
        r.nombre.toLowerCase().includes(term) ||
        (r.correo ?? "").toLowerCase().includes(term) ||
        (r.codigoCliente ?? "").toLowerCase().includes(term) ||
        (r.identificacion ?? "").toLowerCase().includes(term);

      const matchEstado =
        filterEstado === "Todos"
          ? true
          : (r.isActive ? "Activo" : "Inactivo") === filterEstado;

      return matchQ && matchEstado;
    });
  }, [rows, q, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  React.useEffect(() => {
    setPage(1);
  }, [q, filterEstado]);

  const onSaveCliente = async (payload: Cliente) => {
    const endpoint = edit ? `/api/clientes/${payload.clienteID}` : `/api/clientes`;
    const method = edit ? "PUT" : "POST";

    const result = await call<Cliente>(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    if (!result) {
      throw new Error(edit ? "No se pudo actualizar el cliente." : "No se pudo crear el cliente.");
    }

    setFormOpen(false);
    setEdit(null);
    setFeedback({
      type: "success",
      text: edit ? "Cliente actualizado correctamente." : "Cliente creado correctamente.",
    });

    await fetchClientData();
  };

  const toggleEstado = async (r: Cliente) => {
    const toAct = !r.isActive;

    const ok = await confirm({
      title: toAct ? "Reactivar cliente" : "Inactivar cliente",
      message: (
        <>
          ¿Confirmas {toAct ? "reactivar" : "inactivar"} al cliente <b>{r.nombre}</b>?
        </>
      ),
      tone: toAct ? "brand" : "danger",
      confirmText: toAct ? "Reactivar" : "Inactivar",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    try {
      const result = await call<ApiEstadoResponse>(
        `/api/clientes/${r.clienteID}/activo`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: toAct }),
        }
      );

      if (!result) {
        throw new Error("No se pudo actualizar el estado del cliente.");
      }

      setFeedback({
        type: "success",
        text:
          result.message ||
          (toAct
            ? "Cliente reactivado correctamente."
            : "Cliente inactivado correctamente."),
      });

      await fetchClientData();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo actualizar el estado del cliente.";
      setFeedback({ type: "error", text: message });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F0E] px-4 py-5 text-[#E6E9EA] sm:px-6">
      <header className="mb-5">
        <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#8B9AA0]">
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

          <span className="text-[#4B5563]">/</span>

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

        <div className="rounded-2xl border border-black/70 bg-gradient-to-r from-[#14191C] via-[#101416] to-[#0E1214] px-5 py-5 shadow-[0_14px_40px_rgba(0,0,0,.20)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/70 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#8B9AA0]">
                Gestión comercial
              </div>
              <h1 className="mt-3 text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-wide text-white">
                Clientes
              </h1>
              <p className="mt-1 text-sm leading-6 text-[#8B9AA0]">
                Registrar, editar, inactivar y administrar descuentos de clientes.
              </p>
            </div>

            <div className="rounded-xl border border-black/70 bg-white/[0.02] px-4 py-3 text-sm text-[#8B9AA0]">
              <span className="block text-[10px] uppercase tracking-[0.16em] text-[#8B9AA0]">
                Total registrados
              </span>
              <span className="mt-1 block text-2xl font-semibold text-white">
                {rows.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {feedback && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm shadow-sm ${
            feedback.type === "success"
              ? "border-emerald-700/40 bg-emerald-500/10 text-emerald-200"
              : "border-red-700/40 bg-red-500/10 text-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="mb-5 rounded-2xl border border-black/70 bg-[#111517] p-4 shadow-[0_12px_35px_rgba(0,0,0,.16)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-md">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, correo, código o identificación"
                className="w-full rounded-xl border border-black/70 bg-[#121618] py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-[#8B9AA0] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
              />
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
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
              onChange={(e) => setFilterEstado(e.target.value as "Todos" | Estado)}
              className="rounded-xl border border-black/70 bg-[#121618] px-3.5 py-2.5 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
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
              className="!rounded-xl !px-5 !py-2.5"
            >
              Nuevo cliente
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/70 bg-[#111517] shadow-[0_14px_40px_rgba(0,0,0,.18)]">
        <CardTable>
          <thead>
            <tr className="bg-[#1A1F22]">
              <Th>#</Th>
              <Th>Cliente</Th>
              <Th>Email</Th>
              <Th>Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>

          <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-black/70">
            {pageRows.map((r) => (
              <tr
                key={r.clienteID ?? `${r.codigoCliente ?? "sin-codigo"}-${r.nombre}`}
                className="transition hover:bg-white/[0.03]"
              >
                <Td strong>{r.codigoCliente?.trim() || "—"}</Td>
                <Td>
                  <div className="font-medium text-white">{r.nombre}</div>
                  <div className="mt-0.5 text-xs text-[#8B9AA0]">
                    {r.identificacion?.trim() || r.tipoPersona || "—"}
                  </div>
                </Td>
                <Td className="text-[#8B9AA0]">{r.correo?.trim() || "—"}</Td>
                <Td>
                  <PillBadge variant={r.isActive ? "success" : "danger"}>
                    {r.isActive ? "Activo" : "Inactivo"}
                  </PillBadge>
                </Td>
                <Td className="text-right">
                  <div className="inline-flex flex-wrap items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setView(r)}
                      className="!rounded-xl !border-black/70 !bg-transparent hover:!bg-white/5"
                    >
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEdit(r);
                        setFormOpen(true);
                      }}
                      className="!rounded-xl !border-black/70 !bg-white/5 hover:!bg-white/10"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => toggleEstado(r)}
                      className="!rounded-xl"
                    >
                      {r.isActive ? "Inactivar" : "Reactivar"}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}

            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center">
                    <div className="mb-3 rounded-full border border-black/70 bg-white/5 p-3 text-[#8B9AA0]">
                      <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M10 4a6 6 0 1 1-4.472 10 6 6 0 0 1 4.472-10Zm8.707 13.293-2.823-2.823a8 8 0 1 0-1.414 1.414l2.823 2.823a1 1 0 0 0 1.414-1.414Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {loading ? "Cargando clientes..." : "No hay clientes para mostrar."}
                    </p>
                    <p className="mt-1 text-sm text-[#8B9AA0]">
                      Ajusta los filtros o registra un nuevo cliente.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </CardTable>
      </div>

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

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-black/70 bg-[#111517] px-4 py-3 text-sm text-[#8B9AA0] sm:flex-row sm:items-center sm:justify-between">
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