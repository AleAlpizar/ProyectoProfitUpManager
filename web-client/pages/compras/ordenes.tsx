import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";

type Row = {
  id: string;
  proveedor: string;
  fechaEstimada: string;
  estado: "Pendiente" | "Anulada";
  total: string;
};

const FAKE_ROWS: Row[] = [
  { id: "OC-0001", proveedor: "Proveedor A", fechaEstimada: "2025-08-20", estado: "Pendiente", total: "$1,240" },
  { id: "OC-0002", proveedor: "Proveedor B", fechaEstimada: "2025-08-22", estado: "Pendiente", total: "$980" },
];

export default function OrdenesComprasPage() {
  const [rows, setRows] = useState<Row[]>(FAKE_ROWS);

  const [showCancel, setShowCancel] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Row | null>(null);

  useEffect(() => {
    if (!formOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [formOpen]);

  const title = useMemo(
    () => (editData ? "Editar orden de compra" : "Registrar orden de compra"),
    [editData]
  );

  return (
    <div className="p-6">
      <SectionHeader title="Órdenes de compra" subtitle="Registrar, editar y anular solicitudes" />

      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-white/20"
          onClick={() => {
            setEditData(null);
            setFormOpen(true);
          }}
        >
          + Nueva orden
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
        <div className="px-4 py-3 text-sm font-semibold text-white/90">Órdenes pendientes</div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
              <Th>#</Th>
              <Th>Proveedor</Th>
              <Th>Fecha estimada</Th>
              <Th>Estado</Th>
              <Th>Total</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <Td strong>{r.id}</Td>
                <Td>{r.proveedor}</Td>
                <Td>{r.fechaEstimada}</Td>
                <Td>
                  {r.estado === "Pendiente" ? (
                    <Badge tone="success">Pendiente</Badge>
                  ) : (
                    <Badge tone="danger">Anulada</Badge>
                  )}
                </Td>
                <Td>{r.total}</Td>
                <Td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                      onClick={() => {
                        setEditData(r);
                        setFormOpen(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                      onClick={() => {
                        setTargetId(r.id);
                        setShowCancel(true);
                      }}
                    >
                      Anular
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-white/60">
                  No hay órdenes pendientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-white/10 bg-neutral-900 p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
                onClick={() => setFormOpen(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-white/70">Proveedor</label>
                <select
                  defaultValue={editData?.proveedor ?? "Proveedor A"}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20"
                >
                  <option>Proveedor A</option>
                  <option>Proveedor B</option>
                  <option>Proveedor C</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/70">Fecha estimada</label>
                <input
                  type="date"
                  defaultValue={editData?.fechaEstimada}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/70">Observaciones</label>
                <input
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/20"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">Productos solicitados</h3>
                <button
                  type="button"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  + Agregar producto
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
                      <Th>Producto</Th>
                      <Th>Cant.</Th>
                      <Th>Precio</Th>
                      <Th>Subtotal</Th>
                      <Th className="text-right">—</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    <tr className="hover:bg-white/5">
                      <Td>
                        <input
                          placeholder="Producto X"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/20"
                        />
                      </Td>
                      <Td>
                        <input
                          type="number"
                          defaultValue={1}
                          className="w-[90px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/20"
                        />
                      </Td>
                      <Td>
                        <input
                          type="number"
                          defaultValue={100}
                          className="w-[120px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/20"
                        />
                      </Td>
                      <Td strong>$100.00</Td>
                      <Td className="text-right">
                        <button
                          type="button"
                          className="rounded-lg bg-neutral-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-600"
                        >
                          Quitar
                        </button>
                      </Td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap items-start justify-end gap-6">
                <Tot label="Subtotal" value="$100.00" />
                <Tot label="Impuestos" value="$13.00" />
                <Tot label="Total" value="$113.00" strong />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showCancel}
        title="Anular orden de compra"
        message={`¿Confirmas anular la orden ${targetId}?`}
        onClose={() => setShowCancel(false)}
        onConfirm={() => {
          setRows((prev) => prev.map((r) => (r.id === targetId ? { ...r, estado: "Anulada" } : r)));
        }}
        confirmText="Anular"
      />
    </div>
  );
}

const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <th className={["px-3 py-2 font-semibold", className].join(" ")}>{children}</th>
);

const Td: React.FC<React.PropsWithChildren<{ className?: string; strong?: boolean }>> = ({
  className = "",
  strong = false,
  children,
}) => (
  <td className={["px-3 py-2", strong ? "font-semibold text-white/90" : "text-white/80", className].join(" ")}>{children}</td>
);

const Badge: React.FC<React.PropsWithChildren<{ tone?: "success" | "danger" | "default" }>> = ({
  tone = "default",
  children,
}) => {
  const map: Record<string, string> = {
    success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    danger: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
    default: "bg-white/10 text-white/80 ring-1 ring-white/15",
  };
  return (
    <span className={["inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", map[tone]].join(" ")}>
      {children}
    </span>
  );
};

const Tot: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="text-right">
    <div className="text-xs text-white/60">{label}</div>
    <div className={["mt-0.5", strong ? "text-lg font-semibold text-white" : "font-semibold text-white/90"].join(" ")}>
      {value}
    </div>
  </div>
);
