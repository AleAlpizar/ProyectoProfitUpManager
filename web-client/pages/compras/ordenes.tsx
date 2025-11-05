import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";

import { CardTable, Th, Td, PillBadge, PageBtn } from "../../components/ui/table";

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

  const [q, setQ] = useState("");
  const pageSize = 8;
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!formOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [formOpen]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        !term ||
        r.id.toLowerCase().includes(term) ||
        r.proveedor.toLowerCase().includes(term) ||
        r.estado.toLowerCase().includes(term)
    );
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => setPage(1), [q]);

  const title = useMemo(
    () => (editData ? "Editar orden de compra" : "Registrar orden de compra"),
    [editData]
  );

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#E6E9EA] p-6">
      <SectionHeader title="Órdenes de compra" subtitle="Registrar, editar y anular solicitudes" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por #, proveedor o estado"
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
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center rounded-xl bg-[#A30862] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
            onClick={() => {
              setEditData(null);
              setFormOpen(true);
            }}
          >
            + Nueva orden
          </button>
        </div>
      </div>

      <CardTable>
        <thead>
          <tr className="bg-[#1C2224]">
            <Th>#</Th>
            <Th>Proveedor</Th>
            <Th>Fecha estimada</Th>
            <Th>Estado</Th>
            <Th>Total</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </thead>

        <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
          {pageRows.map((r) => (
            <tr key={r.id} className="hover:bg-white/5">
              <Td strong>{r.id}</Td>
              <Td>{r.proveedor}</Td>
              <Td>{r.fechaEstimada}</Td>
              <Td>
                {r.estado === "Pendiente" ? (
                  <PillBadge variant="success">Pendiente</PillBadge>
                ) : (
                  <PillBadge variant="danger">Anulada</PillBadge>
                )}
              </Td>
              <Td>{r.total}</Td>
              <Td className="text-right">
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-xl border border-white/20 bg-transparent px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
                    onClick={() => {
                      setEditData(r);
                      setFormOpen(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-white/20"
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

          {pageRows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#8B9AA0]">
                No hay órdenes pendientes.
              </td>
            </tr>
          )}
        </tbody>
      </CardTable>

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

      {formOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#13171A] p-5 text-[#E6E9EA] shadow-[0_30px_80px_rgba(0,0,0,.55)] ring-1 ring-black/20"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                type="button"
                className="rounded-xl bg-[#A30862] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
                onClick={() => setFormOpen(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-[#8B9AA0]">Proveedor</label>
                <select
                  defaultValue={editData?.proveedor ?? "Proveedor A"}
                  className="w-full rounded-2xl border border-white/10 bg-[#1C2224] px-3 py-2 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
                >
                  <option>Proveedor A</option>
                  <option>Proveedor B</option>
                  <option>Proveedor C</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#8B9AA0]">Fecha estimada</label>
                <input
                  type="date"
                  defaultValue={editData?.fechaEstimada}
                  className="w-full rounded-2xl border border-white/10 bg-[#1C2224] px-3 py-2 text-sm outline-none transition placeholder:text-[#8B9AA0] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#8B9AA0]">Observaciones</label>
                <input
                  placeholder="Opcional"
                  className="w-full rounded-2xl border border-white/10 bg-[#1C2224] px-3 py-2 text-sm outline-none transition placeholder:text-[#8B9AA0] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">Productos solicitados</h3>
                <button
                  type="button"
                  className="rounded-xl bg-[#A30862] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
                >
                  + Agregar producto
                </button>
              </div>

              <CardTable>
                <thead>
                  <tr className="bg-[#1C2224]">
                    <Th>Producto</Th>
                    <Th>Cant.</Th>
                    <Th>Precio</Th>
                    <Th>Subtotal</Th>
                    <Th className="text-right">—</Th>
                  </tr>
                </thead>
                <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
                  <tr className="hover:bg-white/5">
                    <Td>
                      <input
                        placeholder="Producto X"
                        className="w-full rounded-2xl border border-white/10 bg-[#1C2224] px-3 py-2 text-sm outline-none transition placeholder:text-[#8B9AA0] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
                      />
                    </Td>
                    <Td>
                      <input
                        type="number"
                        defaultValue={1}
                        className="w-[90px] rounded-2xl border border-white/10 bg-[#1C2224] px-3 py-2 text-sm outline-none transition placeholder:text-[#8B9AA0] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
                      />
                    </Td>
                    <Td>
                      <input
                        type="number"
                        defaultValue={100}
                        className="w-[120px] rounded-2xl border border-white/10 bg-[#1C2224] px-3 py-2 text-sm outline-none transition placeholder:text-[#8B9AA0] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
                      />
                    </Td>
                    <Td strong>$100.00</Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        className="rounded-xl bg-neutral-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-600"
                      >
                        Quitar
                      </button>
                    </Td>
                  </tr>
                </tbody>
              </CardTable>

              <div className="mt-3 flex flex-wrap items-start justify-end gap-6">
                <Tot label="Subtotal" value="$100.00" />
                <Tot label="Impuestos" value="$13.00" />
                <Tot label="Total" value="$113.00" strong />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center rounded-2xl border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-2xl bg-[#A30862] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40"
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

const Tot: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="text-right">
    <div className="text-xs text-[#8B9AA0]">{label}</div>
    <div className={["mt-0.5", strong ? "text-lg font-semibold text-white" : "font-semibold text-[#E6E9EA]"].join(" ")}>
      {value}
    </div>
  </div>
);
