// components/accounts/Accounts.tsx
import Link from "next/link";
import React from "react";
import { HouseIcon } from "../icons/breadcrumb/house-icon";
import { UsersIcon } from "../icons/breadcrumb/users-icon";
import { ExportIcon } from "../icons/accounts/export-icon";
import { AddUser } from "./add-user";
import Button from "../buttons/button";

type Status = "ACTIVE" | "PAUSED" | "VACATION";
type UserRow = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  team: string;
  status: Status;
};

const FAKE_USERS: UserRow[] = [
  { id: "U-0001", name: "Daniel Vega", email: "daniel.vega@example.com", avatar: "https://avatars.githubusercontent.com/u/11277637?s=400&u=24785105d48d77659a143c00a80454aa0d1b50dc&v=4", role: "Soyla", team: "Management", status: "ACTIVE" },
  { id: "U-0002", name: "Alexandra Alpízar", email: "alexandra.alpizar@example.com", avatar: "https://avatars.githubusercontent.com/u/133933772?v=4", role: "Technical Lead", team: "Development", status: "PAUSED" },
  { id: "U-0003", name: "Cesar Arroyo", email: "cesar.arroyo@example.com", avatar: "https://avatars.githubusercontent.com/u/133933772?v=4", role: "Senior Developer", team: "Development", status: "ACTIVE" },
  { id: "U-0004", name: "Esteban Quesada", email: "esteban.quesada@example.com", avatar: "https://avatars.githubusercontent.com/u/133933772?v=4", role: "Community Manager", team: "Marketing", status: "VACATION" },
];

/* ========= Página ========= */
export default function Accounts() {
  const [rows, setRows] = React.useState<UserRow[]>(FAKE_USERS);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"Todos" | Status>("Todos");

  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !term ||
        r.name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.role.toLowerCase().includes(term) ||
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

  return (
    <div className="p-6 sm:px-16">
      {/* Breadcrumbs minimal */}
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex items-center gap-2 text-sm text-secondary/70">
          <li className="flex items-center gap-2">
            <HouseIcon />
            <Link href="/" className="hover:text-secondary">Inicio</Link>
            <span className="px-1">/</span>
          </li>
          <li className="flex items-center gap-2">
            <UsersIcon />
            <span className="text-secondary">Cuentas</span>
          </li>
        </ol>
      </nav>

      {/* Header como Clientes */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-secondary">Cuentas</h1>
        <p className="text-sm text-secondary/70">Registrar, editar, inactivar y exportar cuentas</p>
      </header>

      {/* Toolbar como Clientes */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, correo o #"
              className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-primary/30"
            />
            <svg className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
            </svg>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-primary/30"
          >
            <option value="Todos">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="PAUSED">Pausados</option>
            <option value="VACATION">Vacaciones</option>
          </select>


        </div>

        <div className="flex items-center gap-3">
          <AddUser />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30"
            onClick={() => console.log("Export CSV (visual)")}
          >
            Exportar CSV
            <ExportIcon />
          </button>
        </div>
      </div>

      {/* Tabla en card, igual que Clientes */}
      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-surface">
              <Th>Nombre</Th>
              <Th>ROL</Th>
              <Th>Estado</Th>
              <Th className="text-right">ACCIONES</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pageRows.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                {/* NAME */}
                <Td>
                  <div className="flex items-center gap-3">
                    {u.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar} alt={u.name} className="h-10 w-10 rounded-full object-cover ring-1 ring-black/5" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                        {u.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-secondary">{u.name}</div>
                      <div className="truncate text-xs text-secondary/60">{u.email}</div>
                    </div>
                  </div>
                </Td>

                <Td>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-secondary">{u.role}</span>
                    <span className="text-xs font-semibold text-secondary/60">{u.team}</span>
                  </div>
                </Td>

                {/* STATUS */}
                <Td>
                  <StatusBadge status={u.status} />
                </Td>

                <Td className="text-right">
                  <div className="inline-flex items-center gap-2">

                    <Button
                    variant="outline-primary"
                       onClick={() => console.log("Editar", u.id)}
                    >
                      Editar
                    </Button>
                    <Button
                    variant="danger"
                      onClick={() => console.log("Inactivar (visual)", u.id)}
                    >
                      Inactivar
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}

            {pageRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-secondary/70">
                  No hay cuentas para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación estilo Clientes */}
      <div className="mt-4 flex items-center justify-between text-sm text-secondary/70">
        <span>
          Mostrando{" "}
          <b>
            {pageRows.length === 0 ? 0 : (page - 1) * pageSize + 1}-
            {(page - 1) * pageSize + pageRows.length}
          </b>{" "}
          de <b>{filtered.length}</b>
        </span>
        <div className="flex items-center gap-2">
          <PageBtn disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </PageBtn>
          <span>
            Página <b>{page}</b> de <b>{totalPages}</b>
          </span>
          <PageBtn disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </PageBtn>
        </div>
      </div>
    </div>
  );
}

/* ========= UI helpers (mismo look que Clientes) ========= */

const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <th className={["px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-secondary", className].join(" ")}>
    {children}
  </th>
);

const Td: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <td className={["px-3 py-2 text-sm text-secondary/80", className].join(" ")}>
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
      "rounded-md px-3 py-1 text-sm",
      "bg-gray-200 text-secondary hover:bg-gray-300",
      "disabled:cursor-not-allowed disabled:opacity-60",
      className,
    ].join(" ")}
    {...props}
  >
    {children}
  </button>
);

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const map: Record<Status, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    PAUSED: "bg-pink-100 text-pink-800",
    VACATION: "bg-amber-200 text-amber-900",
  };
  const label: Record<Status, string> = {
    ACTIVE: "ACTIVE",
    PAUSED: "PAUSED",
    VACATION: "VACATION",
  };
  return (
    <span className={["inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", map[status]].join(" ")}>
      {label[status]}
    </span>
  );
};
