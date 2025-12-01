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

export default function ProvidersPage() {
  const [rows, setRows] = React.useState<ProviderViewModel[]>([]);
  const [q, setQ] = React.useState("");
  const [filterEstado, setFilterEstado] =
    React.useState<FilterEstado>("Todos");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const [view, setView] = React.useState<ProviderViewModel | null>(null);
  const [edit, setEdit] = React.useState<ProviderViewModel | null>(null);

  const { isAuthenticated, hasRole, authHeader } = useSession();
  const confirm = useConfirm();

  const canSee =
    isAuthenticated && (hasRole("Administrador") || hasRole("Vendedor"));

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

  const load = React.useCallback(async () => {
    if (!canSee) return;
    try {
      const data = await listProviders(authHeader as any);
      setRows(data.map(mapToVm));
      setPage(1);
    } catch (e) {
      console.error(e);
    }
  }, [canSee, authHeader]);

  React.useEffect(() => {
    load().catch(console.error);
  }, [load]);

  React.useEffect(() => {
    document.body.classList.toggle("overflow-hidden", !!view || !!edit);
  }, [view, edit]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();

    return rows.filter((r) => {
      const matchQ =
        !term ||
        r.nombre.toLowerCase().includes(term) ||
        (r.correo ?? "").toLowerCase().includes(term) ||
        (r.contacto ?? "").toLowerCase().includes(term);

      const estadoActual: FilterEstado = r.isActive ? "Activo" : "Inactivo";
      const matchEstado =
        filterEstado === "Todos" ? true : estadoActual === filterEstado;

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

  const toggleEstado = async (p: ProviderViewModel) => {
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
      await setProviderStatus(p.proveedorId, nextActive, authHeader as any);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#E6E9EA] p-6">
   
      <header className="mb-6">
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
              <path d="M6 4a3 3 0 1 1-3 3 3 3 0 0 1 3-3Zm12 3a3 3 0 1 0-3 3 3 3 0 0 0 3-3ZM4 15.25A3.25 3.25 0 0 1 7.25 12h1.5A3.25 3.25 0 0 1 12 15.25V19H4Zm9.75-3.25h1.5A3.25 3.25 0 0 1 18.5 15.25V19h-8v-3.75A3.25 3.25 0 0 1 13.75 12Z" />
            </svg>
            <span>Proveedores</span>
          </div>
        </nav>

        <h1 className="text-2xl font-semibold tracking-wide">Proveedores</h1>
        <p className="text-sm text-[#8B9AA0]">
          Registrar, editar, inactivar y administrar proveedores
        </p>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, correo o contacto"
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
            onChange={(e) =>
              setFilterEstado(e.target.value as FilterEstado)
            }
            className="rounded-xl border border-white/10 bg-[#121618] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent transition"
          >
            <option value="Todos">Todos</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </select>
        </div>

        <div className="flex justify-end">
          <AddProvider onCreated={load} />
        </div>
      </div>

      <CardTable>
        <thead>
          <tr className="bg-[#1C2224]">
            <Th>#</Th>
            <Th>Proveedor</Th>
            <Th>Contacto</Th>
            <Th>Teléfono</Th>
            <Th>Estado</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </thead>

        <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
          {pageRows.map((p) => (
            <tr key={p.id} className="hover:bg-white/5 transition">
              <Td strong>{p.id}</Td>

              <Td>
                <div className="font-medium">{p.nombre}</div>
                {p.correo && (
                  <div className="text-xs text-[#8B9AA0] truncate">
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
                <div className="inline-flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setView(p)}
                    className="!rounded-xl !border-white/20 !bg-transparent hover:!bg-white/5"
                  >
                    Ver
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => setEdit(p)}
                    className="!rounded-xl !border-white/20 !bg-white/5 hover:!bg-white/10"
                  >
                    Editar
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => toggleEstado(p)}
                  >
                    {p.isActive ? "Inactivar" : "Reactivar"}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}

          {pageRows.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-sm text-[#8B9AA0]"
              >
                No hay proveedores para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </CardTable>

      {view && (
        <ViewProvider
          provider={view}
          onClose={() => setView(null)}
        />
      )}

      {edit && (
        <EditProvider
          provider={edit}
          onSaved={load}
          onClose={() => setEdit(null)}
        />
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
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
          >
            Next
          </PageBtn>
        </div>
      </div>
    </div>
  );
}
