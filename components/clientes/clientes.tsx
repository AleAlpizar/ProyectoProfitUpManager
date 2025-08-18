import React from "react";
import Button from "../buttons/button";
import { Cliente, Estado } from "./types";
import ClientForm from "./ClientForm";
import DiscountForm from "./DiscountForm";
import Modal from "../modals/Modal";
import { formatMoney } from "../../helpers/ui-helpers";

const FAKE: Cliente[] = [
  {
    id: "CL-0001",
    nombre: "María Rodríguez",
    email: "maria@acme.com",
    estado: "Activo",
    totalCompras: 1240,
    descuento: 5,
  },
  {
    id: "CL-0002",
    nombre: "Juan Pérez",
    email: "juan@beta.io",
    estado: "Activo",
    totalCompras: 980,
  },
  {
    id: "CL-0003",
    nombre: "Sofía García",
    email: "sofia@delta.co",
    estado: "Inactivo",
    totalCompras: 210,
  },
];

export default function ClientesPage() {
  const [rows, setRows] = React.useState<Cliente[]>(FAKE);

  const [q, setQ] = React.useState("");
  const [filterEstado, setFilterEstado] = React.useState<"Todos" | Estado>(
    "Todos"
  );
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  // Modales
  const [formOpen, setFormOpen] = React.useState(false);
  const [edit, setEdit] = React.useState<Cliente | null>(null);

  const [discountOpen, setDiscountOpen] = React.useState(false);
  const [discountTarget, setDiscountTarget] = React.useState<Cliente | null>(
    null
  );
  const [confirm, setConfirm] = React.useState<{
    id: string;
    to: Estado;
  } | null>(null);

  // Bloquear scroll al abrir modales
  React.useEffect(() => {
    const any = formOpen || discountOpen || !!confirm;
    document.body.classList.toggle("overflow-hidden", any);
  }, [formOpen, discountOpen, confirm]);

  // Derivados
  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !term ||
        r.nombre.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term);
      const matchEstado =
        filterEstado === "Todos" ? true : r.estado === filterEstado;
      return matchQ && matchEstado;
    });
  }, [rows, q, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  React.useEffect(() => {
    // si cambian filtros/búsqueda, vuelve a página 1
    setPage(1);
  }, [q, filterEstado]);

  // Handlers
  const onSaveCliente = (payload: Cliente) => {
    if (edit) {
      setRows((prev) =>
        prev.map((c) =>
          c.id === edit.id
            ? {
                ...c,
                nombre: payload.nombre,
                email: payload.email,
                estado: payload.estado,
              }
            : c
        )
      );
    } else {
      // Generar id simple (visual)
      const nextId =
        "CL-" + (1000 + rows.length + 1).toString().padStart(4, "0");
      setRows((prev) => [
        {
          id: nextId,
          nombre: payload.nombre,
          email: payload.email,
          estado: payload.estado,
          totalCompras: 0,
        },
        ...prev,
      ]);
    }
    setFormOpen(false);
    setEdit(null);
  };

  const onSaveDiscount = (value: number) => {
    if (!discountTarget) return;
    setRows((prev) =>
      prev.map((c) =>
        c.id === discountTarget.id ? { ...c, descuento: value } : c
      )
    );
    setDiscountOpen(false);
    setDiscountTarget(null);
  };

  const onConfirmEstado = () => {
    if (!confirm) return;
    setRows((prev) =>
      prev.map((c) => (c.id === confirm.id ? { ...c, estado: confirm.to } : c))
    );
    setConfirm(null);
  };

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-secondary">Clientes</h1>
        <p className="text-sm text-secondary/70">
          Registrar, editar, inactivar y administrar descuentos
        </p>
      </header>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, correo o #"
              className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-primary/30"
            />
            <svg
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60"
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
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-primary/30"
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
            + Nuevo cliente
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-surface">
              <Th>#</Th>
              <Th>Cliente</Th>
              <Th>Email</Th>
              <Th>Estado</Th>
              <Th className="text-right">Total compras</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pageRows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <Td strong>{r.id}</Td>
                <Td>
                  <div className="font-medium text-secondary">{r.nombre}</div>
                  {typeof r.descuento === "number" && (
                    <div className="mt-0.5 text-xs text-secondary/60">
                      Descuento actual:{" "}
                      <span className="font-semibold">{r.descuento}%</span>
                    </div>
                  )}
                </Td>
                <Td className="text-secondary/80">{r.email}</Td>
                <Td>
                  <Badge tone={r.estado === "Activo" ? "success" : "danger"}>
                    {r.estado}
                  </Badge>
                </Td>
                <Td className="text-right font-semibold text-secondary">
                  {formatMoney(r.totalCompras)}
                </Td>
                <Td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setDiscountTarget(r);
                        setDiscountOpen(true);
                      }}
                    >
                      Descuentos
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEdit(r);
                        setFormOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() =>
                        setConfirm({
                          id: r.id ?? "",
                          to: r.estado === "Activo" ? "Inactivo" : "Activo",
                        })
                      }
                    >
                      {r.estado === "Activo" ? "Inactivar" : "Reactivar"}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}

            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-secondary/70"
                >
                  No hay clientes para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
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
          <Button
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span>
            Página <b>{page}</b> de <b>{totalPages}</b>
          </span>
          <Button
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {formOpen && (
        <Modal
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

      {discountOpen && discountTarget && (
        <Modal
          onClose={() => {
            setDiscountOpen(false);
            setDiscountTarget(null);
          }}
        >
          <DiscountForm
            cliente={discountTarget}
            onCancel={() => {
              setDiscountOpen(false);
              setDiscountTarget(null);
            }}
            onSave={onSaveDiscount}
          />
        </Modal>
      )}

      {confirm && (
        <Modal onClose={() => setConfirm(null)}>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-secondary">
              Cambiar estado
            </h2>
            <p className="text-sm text-secondary/80">
              ¿Confirmas {confirm.to === "Activo" ? "reactivar" : "inactivar"}{" "}
              al cliente <b>{confirm.id}</b>?
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
    </div>
  );
}

// TODO: hacer que esto sean components
const Badge: React.FC<
  React.PropsWithChildren<{ tone?: "success" | "danger" | "default" }>
> = ({ tone = "default", children }) => {
  const map: Record<string, string> = {
    success: "bg-success text-white",
    danger: "bg-danger text-white",
    default: "bg-gray-200 text-gray-800",
  };
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        map[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
};

const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <th
    className={[
      "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-secondary",
      className,
    ].join(" ")}
  >
    {children}
  </th>
);

const Td: React.FC<
  React.PropsWithChildren<{ className?: string; strong?: boolean }>
> = ({ className = "", strong = false, children }) => (
  <td
    className={[
      "px-3 py-2 text-sm",
      strong ? "font-semibold text-secondary" : "text-secondary/80",
      className,
    ].join(" ")}
  >
    {children}
  </td>
);
