"use client";

import React from "react";
import Button from "../buttons/button";
import { useSession } from "../hooks/useSession";
import { useConfirm } from "../modals/ConfirmProvider";
import { CardTable, Th, Td, PageBtn, PillBadge } from "../ui/table";

import {
  listProviders,
  setProviderStatus,
  type ProveedorDto,
} from "./providers.api";

import AddProvider from "./AddProvider";
import EditProvider from "./EditProvider";
import ViewProvider, { ProviderViewModel } from "./ViewProvider";

type FilterEstado = "Todos" | "Activo" | "Inactivo";
type AlertState = { type: "success" | "error"; text: string } | null;

export default function ProvidersPage() {
  const [rows, setRows] = React.useState<ProviderViewModel[]>([]);
  const [q, setQ] = React.useState("");
  const [filterEstado, setFilterEstado] =
    React.useState<FilterEstado>("Todos");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const [view, setView] = React.useState<ProviderViewModel | null>(null);
  const [edit, setEdit] = React.useState<ProviderViewModel | null>(null);
  const [alert, setAlert] = React.useState<AlertState>(null);
  const [loading, setLoading] = React.useState(false);
  const [statusLoadingId, setStatusLoadingId] = React.useState<number | null>(null);

  const { isAuthenticated, hasRole, authHeader } = useSession();
  const confirm = useConfirm();

  const canSee =
    isAuthenticated && (hasRole("Administrador") || hasRole("Vendedor"));
  const canManage = isAuthenticated && hasRole("Administrador");

  const mapToVm = (p: ProveedorDto): ProviderViewModel => ({
    id: `P-${String(p.proveedorID).padStart(4, "0")}`,
    proveedorId: p.proveedorID,
    nombre: p.nombre,
    contacto: p.contacto ?? "",
    telefono: p.telefono ?? "",
    correo: p.correo ?? "",
    direccion: p.direccion ?? "",
    isActive: p.isActive,
  });

  const showAlert = React.useCallback((next: AlertState) => {
    setAlert(next);
  }, []);

  const load = React.useCallback(async (successMessage?: string) => {
    if (!canSee) return;

    try {
      setLoading(true);
      setAlert(null);
      const data = await listProviders(authHeader as any);
      setRows(data.map(mapToVm));
      setPage(1);

      if (successMessage) {
        showAlert({ type: "success", text: successMessage });
      }
    } catch (e: any) {
      console.error(e);
      showAlert({
        type: "error",
        text: e?.message || "No se pudieron cargar los proveedores.",
      });
    } finally {
      setLoading(false);
    }
  }, [canSee, authHeader, showAlert]);

  React.useEffect(() => {
    load().catch(console.error);
  }, [load]);

  React.useEffect(() => {
    document.body.classList.toggle("overflow-hidden", !!view || !!edit);

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [view, edit]);

  React.useEffect(() => {
    if (!alert) return;
    const timer = window.setTimeout(() => setAlert(null), 4500);
    return () => window.clearTimeout(timer);
  }, [alert]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();

    return rows.filter((r) => {
      const matchQ =
        !term ||
        r.nombre.toLowerCase().includes(term) ||
        (r.correo ?? "").toLowerCase().includes(term) ||
        (r.contacto ?? "").toLowerCase().includes(term) ||
        (r.telefono ?? "").toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term);

      const estadoActual: FilterEstado = r.isActive ? "Activo" : "Inactivo";
      const matchEstado =
        filterEstado === "Todos" ? true : estadoActual === filterEstado;

      return matchQ && matchEstado;
    });
  }, [rows, q, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  React.useEffect(() => {
    setPage(1);
  }, [q, filterEstado]);

  const handleCreated = async (message?: string) => {
    await load(message || "Proveedor creado correctamente.");
  };

  const handleSaved = async (message?: string) => {
    await load(message || "Proveedor actualizado correctamente.");
  };

  const toggleEstado = async (p: ProviderViewModel) => {
    if (!canManage || statusLoadingId !== null) return;

    const nextActive = !p.isActive;

    const ok = await confirm({
      title: nextActive ? "Reactivar proveedor" : "Inactivar proveedor",
      message: (
        <>
          ¿Confirmas {nextActive ? "reactivar" : "inactivar"} al proveedor{" "}
          <b>{p.nombre}</b>?
        </>
      ),
      tone: nextActive ? "brand" : "danger",
      confirmText: nextActive ? "Reactivar" : "Inactivar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    try {
      setStatusLoadingId(p.proveedorId);
      await setProviderStatus(p.proveedorId, nextActive, authHeader as any);
      await load(
        nextActive
          ? "Proveedor reactivado correctamente."
          : "Proveedor inactivado correctamente."
      );
    } catch (e: any) {
      console.error(e);
      showAlert({
        type: "error",
        text: e?.message || "No se pudo actualizar el estado del proveedor.",
      });
    } finally {
      setStatusLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F0E] px-4 py-6 text-[#E6E9EA] sm:px-6 lg:px-8">
      <header className="mb-7">
        <nav className="mb-4 flex items-center text-sm text-[#8B9AA0]">
          <div className="flex items-center gap-1.5">
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

          <div className="flex items-center gap-1.5 text-white">
            <svg
              className="h-4 w-4 opacity-80"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M6 4a3 3 0 1 1-3 3 3 3 0 0 1 3-3Zm12 3a3 3 0 1 0-3 3 3 3 0 0 0 3-3ZM4 15.25A3.25 3.25 0 0 1 7.25 12h1.5A3.25 3.25 0 0 1 12 15.25V19H4Zm9.75-3.25h1.5A3.25 3.25 0 0 1 18.5 15.25V19h-8v-3.75A3.25 3.25 0 0 1 13.75 12Z" />
            </svg>
            <span>Proveedores</span>
          </div>
        </nav>

        <div className="rounded-[28px] border border-white/10 bg-[#121618] px-5 py-5 shadow-[0_12px_40px_rgba(0,0,0,.22)] sm:px-6">
          <h1 className="text-2xl font-semibold tracking-[0.01em] text-white">
            Proveedores
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[#8B9AA0]">
            Registrar, editar, inactivar y administrar proveedores.
          </p>
        </div>
      </header>

      {alert && (
        <div
          className={`mb-5 rounded-2xl border px-4 py-3.5 text-sm shadow-sm ${
            alert.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {alert.text}
        </div>
      )}

      {!canSee && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          No tienes permisos para visualizar proveedores.
        </div>
      )}

      {canSee && (
        <>
          <div className="mb-5 rounded-[24px] border border-white/10 bg-[#121618] px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,.18)] sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full max-w-md">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por código, nombre, correo, contacto o teléfono"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#0F1315] py-2 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-[#8B9AA0] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
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
                  onChange={(e) =>
                    setFilterEstado(e.target.value as FilterEstado)
                  }
                  className="h-12 rounded-2xl border border-white/10 bg-[#0F1315] px-4 text-sm text-white outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
                >
                  <option value="Todos">Todos</option>
                  <option value="Activo">Activos</option>
                  <option value="Inactivo">Inactivos</option>
                </select>
              </div>

              <div className="flex justify-end">
                {canManage && <AddProvider onCreated={handleCreated} />}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#121618] shadow-[0_14px_40px_rgba(0,0,0,.20)]">
            <CardTable>
              <thead>
                <tr className="bg-[#1A2022]">
                  <Th>#</Th>
                  <Th>Proveedor</Th>
                  <Th>Contacto</Th>
                  <Th>Teléfono</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>

              <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
                {pageRows.map((p) => {
                  const rowBusy = statusLoadingId === p.proveedorId;

                  return (
                    <tr key={p.id} className="transition hover:bg-white/[0.035]">
                      <Td strong>{p.id}</Td>

                      <Td>
                        <div className="font-medium text-white">{p.nombre}</div>
                        {p.correo && (
                          <div className="mt-0.5 truncate text-xs text-[#8B9AA0]">
                            {p.correo}
                          </div>
                        )}
                      </Td>

                      <Td>{p.contacto || "—"}</Td>
                      <Td className="text-[#8B9AA0]">{p.telefono || "—"}</Td>

                      <Td>
                        <PillBadge variant={p.isActive ? "success" : "danger"}>
                          {p.isActive ? "Activo" : "Inactivo"}
                        </PillBadge>
                      </Td>

                      <Td className="text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => setView(p)}
                            disabled={rowBusy}
                            className="!h-10 !rounded-xl !border-white/20 !bg-transparent !px-4 hover:!bg-white/5"
                          >
                            Ver
                          </Button>

                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                onClick={() => setEdit(p)}
                                disabled={rowBusy}
                                className="!h-10 !rounded-xl !border-white/20 !bg-white/5 !px-4 hover:!bg-white/10"
                              >
                                Editar
                              </Button>

                              <Button
                                variant="danger"
                                onClick={() => toggleEstado(p)}
                                disabled={rowBusy}
                                className="!h-10 !rounded-xl !px-4"
                              >
                                {rowBusy
                                  ? "Procesando..."
                                  : p.isActive
                                  ? "Inactivar"
                                  : "Reactivar"}
                              </Button>
                            </>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })}

                {pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-[#8B9AA0]"
                    >
                      {loading
                        ? "Cargando proveedores..."
                        : "No hay proveedores para mostrar."}
                    </td>
                  </tr>
                )}
              </tbody>
            </CardTable>
          </div>

          {view && (
            <ViewProvider
              provider={view}
              onClose={() => setView(null)}
            />
          )}

          {edit && (
            <EditProvider
              provider={edit}
              onSaved={handleSaved}
              onClose={() => setEdit(null)}
            />
          )}

          <div className="mt-5 rounded-[22px] border border-white/10 bg-[#121618] px-4 py-3.5 text-sm text-[#8B9AA0] shadow-[0_10px_30px_rgba(0,0,0,.16)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  Next
                </PageBtn>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}