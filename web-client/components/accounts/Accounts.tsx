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
  name: string;
  email: string;
  avatar?: string;
  role: Role | string;
  team: string;
  status: Status;
  usuarioId?: number;
  telefono?: string | null;
  apellido?: string | null;
};

export default function Accounts() {
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"Todos" | Status>("Todos");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
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

  const mapToRow = (u: UserDto): UserRow => ({
    id: `U-${String(u.usuarioID).padStart(4, "0")}`,
    usuarioId: u.usuarioID,
    name: `${u.nombre}${u.apellido ? " " + u.apellido : ""}`,
    apellido: u.apellido ?? "",
    email: u.correo,
    role: u.rol,
    team: "—",
    status:
      (u.estadoUsuario as Status) ?? (u.isActive ? "ACTIVE" : "PAUSED"),
    telefono: u.telefono ?? "",
  });

  const load = React.useCallback(async () => {
    if (!isAuthenticated || !hasRole("Administrador")) return;
    try {
      setLoading(true);
      const data = await listUsers(authHeader as any);
      setRows(data.map(mapToRow));
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, hasRole, authHeader]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !term ||
        r.name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        String(r.role).toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term);
      const matchF = filter === "Todos" ? true : r.status === filter;
      return matchQ && matchF;
    });
  }, [rows, q, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  React.useEffect(() => setPage(1), [q, filter]);

  const handleCreated = () => load();

  const onChangeRole = async (u: UserRow, newRole: Role) => {
    if (!u.usuarioId || newRole === u.role) return;
    const ok = await confirm({
      title: "Confirmar cambio de rol",
      message: (
        <>
          ¿Cambiar el rol de <b>{u.name}</b> a <b>{newRole}</b>?
        </>
      ),
      confirmText: "Sí, cambiar",
      tone: "warning",
    });
    if (!ok) return;

    try {
      await updateUserRole(u.usuarioId, newRole, authHeader as any);
      setRows((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x))
      );
    } catch (e: any) {
      alert(e?.message || "No se pudo cambiar el rol");
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
          ¿Cambiar el estado de <b>{u.name}</b> a <b>{human}</b>?
        </>
      ),
      confirmText: "Sí, cambiar",
      tone: "warning",
    });
    if (!ok) return;

    try {
      await setUserStatus(u.usuarioId, status, authHeader as any);
      setRows((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, status } : x))
      );
    } catch (e: any) {
      alert(e?.message || "No se pudo cambiar el estado");
    }
  };

  const openEdit = (u: UserRow) => {
    if (!u.usuarioId) return;
    const [nombre, ...ap] = u.name.split(" ");
    setEditUser({
      usuarioId: u.usuarioId,
      nombre: nombre ?? "",
      apellido: u.apellido ?? ap.join(" "),
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
      await registerUsersReport(authHeader as any, {
        q,
        estado: filter,
        key: "usuarios",
        title: "Usuarios",
      });

      await exportUsersPdf(authHeader as any, "usuarios");
    } catch (e: any) {
      alert(e?.message || "No se pudo exportar el PDF");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#E6E9EA] p-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex items-center gap-2 text-sm text-[#8B9AA0]">
          <li className="flex items-center gap-2">
            <HouseIcon />
            <Link href="/" className="hover:text-white transition">
              Inicio
            </Link>
            <span className="px-1 text-[#8B9AA0]">/</span>
          </li>
          <li className="flex items-center gap-2">
            <UsersIcon />
            <span className="text-white">Cuentas</span>
          </li>
        </ol>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-wide">Cuentas</h1>
        <p className="text-sm text-[#8B9AA0]">
          Registrar, editar, inactivar y exportar cuentas
        </p>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <label className="relative w-full max-w-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, correo o #"
              className="w-full rounded-xl border border-white/10 bg-[#121618] pl-9 pr-3 py-2 text-sm outline-none placeholder:text-[#8B9AA0] focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent transition"
            />
            <svg
              className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
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
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-[#121618] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent transition"
          >
            <option value="Todos">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="PAUSED">Inactivos</option>
            <option value="VACATION">Vacaciones</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && hasRole("Administrador") && (
            <AddUser onCreated={handleCreated} />
          )}

          <div className="inline-flex gap-2">
            <button
              type="button"
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#A30862] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40 disabled:opacity-50"
              onClick={handleExportPdf}
              title="Exportar PDF"
            >
              {exporting ? "Exportando…" : "Exportar PDF"}
            </button>
          </div>
        </div>
      </div>

      <CardTable>
        <thead>
          <tr className="bg-[#1C2224]">
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
                className="px-4 py-10 text-center text-sm text-[#8B9AA0]"
              >
                Cargando usuarios…
              </td>
            </tr>
          )}

          {!loading &&
            pageRows.map((u) => (
              <tr key={u.id} className="hover:bg-white/5">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-semibold text-white">
                      {u.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {u.name}
                      </div>
                      <div className="truncate text-xs text-[#8B9AA0]">
                        {u.email}
                      </div>
                    </div>
                  </div>
                </Td>

                <Td>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold">
                      {u.role}
                    </span>
                    {isAuthenticated && hasRole("Administrador") && (
                      <select
                        className={SELECT_CLS}
                        value={
                          u.role === "Administrador"
                            ? "Administrador"
                            : "Empleado"
                        }
                        onChange={(e) =>
                          onChangeRole(u, e.target.value as Role)
                        }
                        title="Cambiar rol"
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
                        className={SELECT_CLS}
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
                      className="!rounded-xl !border-white/20 !bg-transparent hover:!bg-white/5 !text-white"
                    >
                      Editar
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}

          {!loading && pageRows.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-10 text-center text-sm text-[#8B9AA0]"
              >
                No hay cuentas para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </CardTable>

      <div className="mt-4 flex items-center justify-between text-sm text-[#8B9AA0]">
        <span>
          Mostrando{" "}
          <b className="text-white">
            {pageRows.length === 0
              ? 0
              : (page - 1) * pageSize + 1}
            -
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
            {" "}
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

      {editUser && (
        <EditUser
          user={editUser}
          onSaved={load}
          onClose={() => setEditUser(null)}
        />
      )}
    </div>
  );
}
