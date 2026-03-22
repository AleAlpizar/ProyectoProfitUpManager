import React from "react";
import Link from "next/link";

import { HouseIcon } from "../icons/breadcrumb/house-icon";
import { UsersIcon } from "../icons/breadcrumb/users-icon";

import { useSession } from "../hooks/useSession";
import {
  listUsers,
  updateUserRole,
  setUserStatus,
  type Role,
  type UserDto,
  type Status,
} from "./accounts.api";
import { AddUser } from "./add-user";
import EditUser from "./EditUser";
import Button from "../buttons/button";
import { useConfirm } from "../modals/ConfirmProvider";

import {
  CardTable,
  Th,
  Td,
  PageBtn,
  StatusPill,
  SELECT_CLS,
} from "../ui/table";
import {
  registerUsersReport,
  exportUsersPdf,
} from "../../helpers/reportClient";

type UserRow = {
  id: string;
  usuarioId: number;
  nombre: string;
  apellido?: string | null;
  fullName: string;
  email: string;
  avatar?: string;
  role: Role | string;
  team: string;
  status: Status;
  telefono?: string | null;
};

function getUserId(dto: UserDto): number {
  return Number(dto.usuarioID ?? dto.UsuarioID ?? 0);
}

function getInitials(nombre: string, apellido?: string | null) {
  const first = (nombre || "").trim().charAt(0);
  const second = (apellido || "").trim().charAt(0);
  return `${first}${second}`.trim().toUpperCase() || "US";
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  if (typeof window !== "undefined") {
    return window.atob(padded);
  }

  return "";
}

function getCurrentUserIdFromAuthHeader(
  authHeader?: Record<string, string>
): number {
  try {
    const raw =
      authHeader?.Authorization ??
      authHeader?.authorization ??
      "";

    if (!raw.startsWith("Bearer ")) return 0;

    const token = raw.slice(7).trim();
    if (!token) return 0;

    const parts = token.split(".");
    if (parts.length < 2) return 0;

    const payloadText = decodeBase64Url(parts[1]);
    if (!payloadText) return 0;

    const payload = JSON.parse(payloadText);
    const uid = payload?.uid ?? payload?.sub ?? payload?.nameid ?? payload?.nameidentifier;

    const parsed = Number(uid);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export default function Accounts() {
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"Todos" | Status>("Todos");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [editUser, setEditUser] = React.useState<null | {
    usuarioId: number;
    nombre: string;
    apellido?: string;
    correo: string;
    telefono?: string | null;
    rol: Role;
  }>(null);

  const pageSize = 8;
  const { isAuthenticated, hasRole, authHeader } = useSession();
  const confirm = useConfirm();

  const currentUserId = React.useMemo(
    () => getCurrentUserIdFromAuthHeader(authHeader as Record<string, string>),
    [authHeader]
  );

  const mapToRow = React.useCallback((u: UserDto): UserRow => {
    const usuarioId = getUserId(u);

    return {
      id: `U-${String(usuarioId).padStart(4, "0")}`,
      usuarioId,
      nombre: u.nombre ?? "",
      apellido: u.apellido ?? "",
      fullName: `${u.nombre ?? ""}${u.apellido ? " " + u.apellido : ""}`.trim(),
      email: u.correo,
      role: u.rol,
      team: "—",
      status:
        (u.estadoUsuario as Status) ?? (u.isActive ? "ACTIVE" : "PAUSED"),
      telefono: u.telefono ?? "",
    };
  }, []);

  const load = React.useCallback(async () => {
    if (!isAuthenticated || !hasRole("Administrador")) return;

    try {
      setLoading(true);
      setError(null);

      const data = await listUsers(authHeader as Record<string, string>);
      setRows(data.map(mapToRow));
      setPage(1);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, hasRole, authHeader, mapToRow]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 3500);
    return () => window.clearTimeout(timer);
  }, [success]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();

    return rows.filter((r) => {
      const matchQ =
        !term ||
        r.fullName.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        String(r.role).toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term);

      const matchF = filter === "Todos" ? true : r.status === filter;
      return matchQ && matchF;
    });
  }, [rows, q, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pageRows = React.useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, totalPages]);

  React.useEffect(() => setPage(1), [q, filter]);

  const handleCreated = async () => {
    setSuccess("Usuario creado correctamente.");
    await load();
  };

  const onChangeRole = async (u: UserRow, newRole: Role) => {
    if (!u.usuarioId || newRole === u.role) return;

    if (u.usuarioId === currentUserId) {
      setError("No puedes cambiar tu propio rol mientras estás autenticado.");
      return;
    }

    const ok = await confirm({
      title: "Confirmar cambio de rol",
      message: (
        <>
          ¿Cambiar el rol de <b>{u.fullName}</b> a <b>{newRole}</b>?
        </>
      ),
      confirmText: "Sí, cambiar",
      tone: "warning",
    });
    if (!ok) return;

    try {
      setError(null);
      await updateUserRole(u.usuarioId, newRole, authHeader as Record<string, string>);

      setRows((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x))
      );
      setSuccess("Rol actualizado correctamente.");
    } catch (e: any) {
      setError(e?.message || "No se pudo cambiar el rol.");
    }
  };

  const onChangeStatus = async (u: UserRow, status: Status) => {
    if (!u.usuarioId || status === u.status) return;

    const human =
      status === "ACTIVE"
        ? "Activo"
        : status === "PAUSED"
        ? "Inactivo"
        : "Vacaciones";

    const ok = await confirm({
      title: "Confirmar cambio de estado",
      message: (
        <>
          ¿Cambiar el estado de <b>{u.fullName}</b> a <b>{human}</b>?
        </>
      ),
      confirmText: "Sí, cambiar",
      tone: "warning",
    });
    if (!ok) return;

    try {
      setError(null);
      await setUserStatus(u.usuarioId, status, authHeader as Record<string, string>);

      setRows((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, status } : x))
      );
      setSuccess("Estado actualizado correctamente.");
    } catch (e: any) {
      setError(e?.message || "No se pudo cambiar el estado.");
    }
  };

  const openEdit = (u: UserRow) => {
    setEditUser({
      usuarioId: u.usuarioId,
      nombre: u.nombre,
      apellido: u.apellido ?? "",
      correo: u.email,
      telefono: u.telefono ?? "",
      rol: (u.role as Role) ?? "Empleado",
    });
  };

  async function handleExportPdf() {
    if (!isAuthenticated || !hasRole("Administrador")) return;

    const ok = await confirm({
      title: "Exportar usuarios a PDF",
      message: (
        <>
          ¿Deseas generar el PDF de <b>usuarios</b> con los filtros actuales?
        </>
      ),
      confirmText: "Sí, exportar",
      cancelText: "Cancelar",
      tone: "brand",
    });
    if (!ok) return;

    try {
      setExporting(true);
      setError(null);

      await registerUsersReport(authHeader as Record<string, string>, {
        q,
        estado: filter,
        key: "usuarios",
        title: "Usuarios",
      });

      await exportUsersPdf(authHeader as Record<string, string>, "usuarios");
      setSuccess("PDF exportado correctamente.");
    } catch (e: any) {
      setError(e?.message || "No se pudo exportar el PDF.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E0F] text-[#E8ECEE] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center gap-2 text-sm text-[#90A0A6]">
            <li className="flex items-center gap-2">
              <HouseIcon />
              <Link href="/" className="transition hover:text-white">
                Inicio
              </Link>
              <span className="px-1 text-[#66757C]">/</span>
            </li>
            <li className="flex items-center gap-2">
              <UsersIcon />
              <span className="text-white">Cuentas</span>
            </li>
          </ol>
        </nav>

        <header className="mb-6 rounded-3xl border border-white/10 bg-[#111618] px-5 py-5 shadow-[0_20px_50px_rgba(0,0,0,.24)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#A7B3B8]">
                Administración
              </div>
              <h1 className="text-2xl font-semibold tracking-wide text-white">
                Cuentas
              </h1>
              <p className="mt-1 text-sm text-[#93A3A9]">
                Registrar, editar, inactivar y exportar cuentas del sistema.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0C1011] px-4 py-3 text-sm text-[#A7B3B8]">
              Total visible:{" "}
              <span className="font-semibold text-white">{filtered.length}</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-2xl border border-[#7B1E2C]/40 bg-[#7B1E2C]/15 px-4 py-3 text-sm text-[#FFD5DC] shadow-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-sm">
            {success}
          </div>
        )}

        <section className="mb-5 rounded-3xl border border-white/10 bg-[#111618] p-4 shadow-[0_18px_40px_rgba(0,0,0,.18)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative w-full sm:max-w-md">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nombre, correo o #"
                  className="w-full rounded-2xl border border-white/10 bg-[#0C1011] pl-10 pr-4 py-3 text-sm text-white outline-none placeholder:text-[#7F9198] transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
                />
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F9198]"
                  viewBox="0 0 24 24"
                  fill="none"
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
              </label>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "Todos" | Status)}
                className="min-w-[170px] rounded-2xl border border-white/10 bg-[#0C1011] px-4 py-3 text-sm text-white outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
              >
                <option value="Todos">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="PAUSED">Inactivos</option>
                <option value="VACATION">Vacaciones</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {isAuthenticated && hasRole("Administrador") && (
                <AddUser onCreated={handleCreated} />
              )}

              <button
                type="button"
                disabled={exporting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#A30862] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_25px_rgba(163,8,98,.22)] transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleExportPdf}
                title="Exportar PDF"
              >
                {exporting ? "Exportando…" : "Exportar PDF"}
              </button>
            </div>
          </div>
        </section>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111618] shadow-[0_20px_45px_rgba(0,0,0,.22)]">
          <CardTable>
            <thead>
              <tr className="bg-[#171D1F]">
                <Th>Nombre</Th>
                <Th>ROL</Th>
                <Th>Estado</Th>
                <Th className="text-right">ACCIONES</Th>
              </tr>
            </thead>

            <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
              {loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-sm text-[#90A0A6]"
                  >
                    Cargando usuarios…
                  </td>
                </tr>
              )}

              {!loading &&
                pageRows.map((u) => {
                  const isCurrentUser = u.usuarioId === currentUserId;

                  return (
                    <tr
                      key={u.id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] text-sm font-semibold text-white shadow-inner">
                            {getInitials(u.nombre, u.apellido)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-sm font-semibold text-white">
                                {u.fullName}
                              </div>

                              {isCurrentUser && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[#D6DEE1]">
                                  Tú
                                </span>
                              )}
                            </div>

                            <div className="mt-0.5 truncate text-xs text-[#8B9AA0]">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </Td>

                      <Td>
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-semibold text-white">
                            {u.role}
                          </span>

                          {isAuthenticated && hasRole("Administrador") && (
                            <select
                              className={`${SELECT_CLS} min-w-[145px] rounded-xl border-white/10 bg-[#0C1011] text-white disabled:cursor-not-allowed disabled:opacity-50`}
                              value={u.role}
                              onChange={(e) =>
                                onChangeRole(u, e.target.value as Role)
                              }
                              title={
                                isCurrentUser
                                  ? "No puedes cambiar tu propio rol"
                                  : "Cambiar rol"
                              }
                              disabled={isCurrentUser}
                            >
                              <option value="Empleado">Empleado</option>
                              <option value="Administrador">Administrador</option>
                            </select>
                          )}
                        </div>
                      </Td>

                      <Td>
                        <div className="flex items-center justify-between gap-3">
                          <StatusPill status={u.status} />

                          {isAuthenticated && hasRole("Administrador") && (
                            <select
                              className={`${SELECT_CLS} min-w-[145px] rounded-xl border-white/10 bg-[#0C1011] text-white`}
                              value={u.status}
                              onChange={(e) =>
                                onChangeStatus(u, e.target.value as Status)
                              }
                              title="Cambiar estado"
                            >
                              <option value="ACTIVE">Activo</option>
                              <option value="PAUSED">Inactivo</option>
                              <option value="VACATION">Vacaciones</option>
                            </select>
                          )}
                        </div>
                      </Td>

                      <Td className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline-primary"
                            onClick={() => openEdit(u)}
                            className="!rounded-2xl !border-white/15 !bg-white/[0.02] !px-4 !py-2.5 !text-white hover:!bg-white/[0.06]"
                          >
                            Editar
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}

              {!loading && pageRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-sm text-[#8B9AA0]"
                  >
                    No hay cuentas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </CardTable>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111618] px-4 py-4 text-sm text-[#8B9AA0] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando{" "}
            <b className="text-white">
              {pageRows.length === 0 ? 0 : (Math.min(page, totalPages) - 1) * pageSize + 1}
              -
              {(Math.min(page, totalPages) - 1) * pageSize + pageRows.length}
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
            <span className="px-2">
              Página <b className="text-white">{Math.min(page, totalPages)}</b> de{" "}
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

        {editUser && (
          <EditUser
            user={editUser}
            onSaved={async () => {
              setSuccess("Usuario actualizado correctamente.");
              await load();
            }}
            onClose={() => setEditUser(null)}
          />
        )}
      </div>
    </div>
  );
}