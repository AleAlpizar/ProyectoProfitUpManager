import Link from "next/link";
import React from "react";
import { HouseIcon } from "../icons/breadcrumb/house-icon";
import { UsersIcon } from "../icons/breadcrumb/users-icon";
import { ExportIcon } from "../icons/accounts/export-icon";
import { AddUser } from "./add-user";
import Button from "../buttons/button";
import { useSession } from "@/hooks/useSession";
import { listUsers, updateUserRole, type Role, type UserDto } from "./accounts.api";

type Status = "ACTIVE" | "PAUSED" | "VACATION";
type UserRow = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role | string;
  team: string;
  status: Status;
  usuarioId?: number;
};

export default function Accounts() {
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"Todos" | Status>("Todos");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const pageSize = 8;

  const { isAuthenticated, hasRole, authHeader } = useSession();

  const mapToRow = (u: UserDto): UserRow => ({
    id: `U-${String(u.usuarioID).padStart(4, "0")}`,
    usuarioId: u.usuarioID,
    name: `${u.nombre}${u.apellido ? " " + u.apellido : ""}`,
    email: u.correo,
    role: u.rol,
    team: "—",
    status: u.isActive ? "ACTIVE" : "PAUSED",
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

  React.useEffect(() => { load(); }, [load]);

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

  const handleCreated = () => { load(); };

  const onChangeRole = async (u: UserRow, newRole: Role) => {
    if (!u.usuarioId) return;
    try {
      await updateUserRole(u.usuarioId, newRole, authHeader as any);
      setRows((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)));
    } catch (e: any) {
      alert(e?.message || "No se pudo cambiar el rol");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#E6E9EA] p-6 sm:px-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex items-center gap-2 text-sm text-[#8B9AA0]">
          <li className="flex items-center gap-2">
            <HouseIcon />
            <Link href="/" className="hover:text-white transition">Inicio</Link>
            <span className="px-1 text-[#8B9AA0]">/</span>
          </li>
          <li className="flex items-center gap-2">
            <UsersIcon />
            <span className="text-white">Cuentas</span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-wide">Cuentas</h1>
        <p className="text-sm text-[#8B9AA0]">Registrar, editar, inactivar y exportar cuentas</p>
      </header>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <label className="relative w-full max-w-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, correo o #"
              className="w-full rounded-xl border border-white/10 bg-[#121618] pl-9 pr-3 py-2 text-sm outline-none
                         placeholder:text-[#8B9AA0] focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent transition"
            />
            <svg
              className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
            </svg>
          </label>

          {/* Status filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-[#121618] px-3 py-2 text-sm outline-none
                       focus:ring-2 focus:ring-[#A30862]/40 focus:border-transparent transition"
          >
            <option value="Todos">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="PAUSED">Pausados</option>
            <option value="VACATION">Vacaciones</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && hasRole("Administrador") && <AddUser onCreated={handleCreated} />}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#A30862] px-4 py-2 text-sm font-medium text-white shadow-sm
                       transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
            onClick={() => console.log("Export CSV (visual)")}
          >
            Exportar CSV
            <ExportIcon />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121618] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <table className="min-w-full border-collapse">
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
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-[#8B9AA0]">
                  Cargando usuarios…
                </td>
              </tr>
            )}

            {!loading && pageRows.map((u) => (
              <tr key={u.id} className="hover:bg-white/5">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-semibold text-white">
                      {u.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{u.name}</div>
                      <div className="truncate text-xs text-[#8B9AA0]">{u.email}</div>
                    </div>
                  </div>
                </Td>

                <Td>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{u.role}</span>
                    {isAuthenticated && hasRole("Administrador") && (
                      <select
                        className="rounded-lg border border-white/10 bg-[#1C2224] px-2 py-1 text-xs
                                   focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
                        value={u.role === "Administrador" ? "Administrador" : "Empleado"}
                        onChange={(e) => onChangeRole(u, e.target.value as Role)}
                        title="Cambiar rol"
                      >
                        <option value="Empleado">Empleado</option>
                        <option value="Administrador">Administrador</option>
                      </select>
                    )}
                  </div>
                </Td>

                <Td><StatusBadge status={u.status} /></Td>

                <Td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    {/* Asumo que tu <Button> admite variant; si no, puedes reemplazar por <button> */}
                    <Button
                      variant="outline-primary"
                      onClick={() => console.log("Editar", u.id)}
                      className="!rounded-xl !border-white/20 !bg-transparent hover:!bg-white/5 !text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => console.log("Inactivar (visual)", u.id)}
                      className="!rounded-xl !bg-[#6C0F1C] hover:!opacity-95"
                    >
                      Inactivar
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}

            {!loading && pageRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-[#8B9AA0]">
                  No hay cuentas para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

/* ---------- tiny presentational helpers (dark-first) ---------- */

const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <th
    className={[
      "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide",
      "text-[#8B9AA0]"
    , className].join(" ")}
  >
    {children}
  </th>
);

const Td: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <td className={["px-3 py-3 text-sm", className].join(" ")}>
    {children}
  </td>
);

const PageBtn: React.FC<React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>> = ({
  className = "", children, ...props
}) => (
  <button
    className={[
      "rounded-xl px-3 py-1 text-sm transition",
      "bg-[#1C2224] text-white hover:bg-white/10",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "focus:outline-none focus:ring-2 focus:ring-[#A30862]/40",
      className
    ].join(" ")}
    {...props}
  >
    {children}
  </button>
);

const StatusBadge: React.FC<{ status: "ACTIVE" | "PAUSED" | "VACATION" }> = ({ status }) => {
  const map: Record<"ACTIVE" | "PAUSED" | "VACATION", string> = {
    ACTIVE:   "bg-[#95B64F]/20 text-[#95B64F] border-[#95B64F]/30",
    PAUSED:   "bg-[#6C0F1C]/20 text-[#F7C6CF] border-[#6C0F1C]/40",
    VACATION: "bg-amber-400/20 text-amber-300 border-amber-400/30",
  };
  const label = { ACTIVE: "ACTIVO", PAUSED: "PAUSADO", VACATION: "VACACIONES" } as const;
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        "border", map[status]
      ].join(" ")}
    >
      {label[status]}
    </span>
  );
};
