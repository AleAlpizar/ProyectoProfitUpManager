"use client";
import React from "react";
import EditarCantidadModal from "@/components/inventario/EditarCantidadModal";

import { useProductoDetalle } from "../hooks/useProductoDetalle";
import { useProductoInactivar } from "../hooks/useProductoInactivar";
import { useBodegas } from "../hooks/useBodegas";
import { useApi } from "@/components/hooks/useApi";

import { CardTable, Th, Td, PillBadge } from "@/components/ui/table";

type ProductoMini = {
  productoID: number;
  sku?: string | null;
  nombre: string;
  descripcion?: string | null;
  descuento?: number | null;
  precioVenta?: number | null;
  isActive?: boolean;
};
type Row = ProductoMini;
type Props = { filtroId: number | "" };
type EstadoFiltro = "activos" | "inactivos" | "todos";

const WINE = "#A30862"; 
const SURFACE = "#121618";
const SURFACE_SOFT = "#0F1214";

export default function ProductosTable({ filtroId }: Props) {
  const { call } = useApi();
  const { detalle, loadDetalle, loading: detalleLoading, error: detalleError } = useProductoDetalle();
  const { inactivar } = useProductoInactivar();
  const { data: bodegas = [] } = useBodegas();

  const [estado, setEstado] = React.useState<EstadoFiltro>("activos");

  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await call<Row[]>(`/api/productos/mini?estado=${estado}`, { method: "GET" });
      setRows(items.map((p) => ({ ...p, isActive: p.isActive ?? true })));
    } catch {
      setError("Error al cargar productos.");
    } finally {
      setLoading(false);
    }
  }, [call, estado]);

  React.useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const [toast, setToast] = React.useState<{ kind: "ok" | "err" | "warn"; msg: string } | null>(null);

  const [editModal, setEditModal] = React.useState<{
    open: boolean;
    id?: number;
    nombre: string;
    descripcion: string;
    descuento: number;
    precioVenta: number;
    sku?: string | null;
    codigoInterno?: string | null;
    unidadAlmacenamientoID?: number | null;
    precioCosto?: number | null;
    peso?: number | null;
    largo?: number | null;
    alto?: number | null;
    ancho?: number | null;
  }>({
    open: false,
    nombre: "",
    descripcion: "",
    descuento: 0,
    precioVenta: 0,
  });

  const [updating, setUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  const [detalleId, setDetalleId] = React.useState<number | null>(null);
  const [openEditarStock, setOpenEditarStock] = React.useState<{
    productoID: number;
    bodegaID?: number | null;
    productoNombre?: string;
  } | null>(null);

  const filtered = React.useMemo(() => {
    if (!rows || rows.length === 0) return [];
    if (filtroId === "") return rows;
    const id = Number(filtroId);
    return rows.filter((p) => p.productoID === id);
  }, [rows, filtroId]);

  /** === Editar === */
  const openEdit = async (p: Row) => {
    try {
      await loadDetalle(p.productoID);
      const anyDet = (detalle as any) || {};
      setEditModal({
        open: true,
        id: p.productoID,
        nombre: p.nombre,
        descripcion: p.descripcion ?? "",
        descuento: p.descuento ?? 0,
        precioVenta: Number(p.precioVenta ?? anyDet.precioVenta ?? 0) || 0,
        sku: p.sku ?? null,
        codigoInterno: anyDet.codigoInterno ?? null,
        unidadAlmacenamientoID: anyDet.unidadAlmacenamientoID ?? null,
        precioCosto: anyDet.precioCosto ?? null,
        peso: anyDet.peso ?? null,
        largo: anyDet.largo ?? null,
        alto: anyDet.alto ?? null,
        ancho: anyDet.ancho ?? null,
      });
    } catch {
      setEditModal({
        open: true,
        id: p.productoID,
        nombre: p.nombre,
        descripcion: p.descripcion ?? "",
        descuento: p.descuento ?? 0,
        precioVenta: Number(p.precioVenta ?? 0) || 0,
        sku: p.sku ?? null,
      });
    }
  };
  const closeEdit = () => setEditModal((m) => ({ ...m, open: false }));

  const saveEdit = async () => {
    if (!editModal.id) return;
    setUpdating(true);
    setUpdateError(null);

    const payload = {
      nombre: editModal.nombre.trim(),
      descripcion: editModal.descripcion.trim(),
      descuento: editModal.descuento ?? 0,
      precioVenta: editModal.precioVenta,
      sku: editModal.sku ?? undefined,
      codigoInterno: editModal.codigoInterno ?? undefined,
      unidadAlmacenamientoID: editModal.unidadAlmacenamientoID,
      precioCosto: editModal.precioCosto,
      peso: editModal.peso,
      largo: editModal.largo,
      alto: editModal.alto,
      ancho: editModal.ancho,
    };

    try {
      await call<void>(`/api/productos/${editModal.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });


      setRows((prev) =>
        prev.map((r) =>
          r.productoID === editModal.id
            ? {
                ...r,
                nombre: editModal.nombre,
                descripcion: editModal.descripcion,
                descuento: editModal.descuento,
                precioVenta: editModal.precioVenta,
                sku: editModal.sku ?? r.sku,
              }
            : r
        )
      );

      setToast({ kind: "ok", msg: "Producto actualizado correctamente." });
      closeEdit();
    } catch {
      setUpdateError("No se pudieron guardar los cambios.");
      setToast({ kind: "err", msg: "No se pudieron guardar los cambios." });
    } finally {
      setUpdating(false);
    }
  };

  const doInactivar = async (row: Row) => {
    if (!confirm(`¿Inactivar el producto "${row.nombre}"?`)) return;
    const { ok } = await inactivar(row.productoID);
    if (!ok) throw new Error();
    setRows((prev) => prev.map((r) => (r.productoID === row.productoID ? { ...r, isActive: false } : r)));
    setToast({ kind: "ok", msg: `Producto "${row.nombre}" inactivado.` });
  };

  const doReactivar = async (row: Row) => {
    if (!confirm(`¿Reactivar el producto "${row.nombre}"?`)) return;
    await call<void>(`/api/productos/${row.productoID}/activar`, { method: "POST" });
    setRows((prev) => prev.map((r) => (r.productoID === row.productoID ? { ...r, isActive: true } : r)));
    setToast({ kind: "ok", msg: `Producto "${row.nombre}" reactivado.` });
  };

  const showDetalle = async (id: number) => {
    setDetalleId(id);
    await loadDetalle(id);
  };
  const closeDetalle = () => setDetalleId(null);

  const abrirModalStock = (row: Row) =>
    setOpenEditarStock({ productoID: row.productoID, productoNombre: row.nombre, bodegaID: null });

  return (
    <div className="mt-4">
      <style jsx global>{`
        select.dark-select option {
          background: ${SURFACE_SOFT};
          color: #e6e9ea;
        }
      `}</style>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="text-sm text-white/80">Mostrar:</label>
        <div className="relative">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoFiltro)}
            className="dark-select appearance-none rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2 pr-9 text-sm text-white outline-none focus:border-white/20"
          >
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="todos">Todos</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/60">▾</span>
        </div>

        <button
          onClick={() => load()}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          Recargar
        </button>
      </div>

      {toast && (
        <div
          className={[
            "mb-3 rounded-xl px-4 py-2 text-sm",
            toast.kind === "ok"
              ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : toast.kind === "warn"
              ? "border border-amber-400/30 bg-amber-400/10 text-amber-200"
              : "border border-rose-400/30 bg-rose-400/10 text-rose-200",
          ].join(" ")}
        >
          {toast.msg}
        </div>
      )}
      {error && (
        <div className="mb-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
      {updateError && (
        <div className="mb-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
          {updateError}
        </div>
      )}

      <CardTable>
        <thead>
          <tr className="bg-[#1C2224]">
            <Th>SKU</Th>
            <Th>Nombre</Th>
            <Th>Descripción</Th>
            <Th>Descuento (%)</Th>
            <Th>Estado</Th>
            <Th>Acciones</Th>
            <Th>Detalles</Th>
          </tr>
        </thead>

        <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
          {loading && rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-3 text-center text-[#8B9AA0]">
                Cargando…
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-3 text-center text-[#8B9AA0]">
                No hay productos.
              </td>
            </tr>
          ) : (
            filtered.map((p) => {
              const activo = p.isActive ?? true;
              return (
                <tr key={p.productoID} className="hover:bg-white/5">
                  <Td className="font-mono text-[#E6E9EA]/80">{p.sku ?? "—"}</Td>
                  <Td>
                    <span className="font-medium text-white">{p.nombre}</span>
                  </Td>
                  <Td>
                    <span className="text-[#E6E9EA]/80">{p.descripcion ?? "—"}</span>
                  </Td>
                  <Td>
                    <PillBadge variant={p.descuento ? "warning" : "default"}>{p.descuento ?? 0}%</PillBadge>
                  </Td>

                  <Td>
                    {activo ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-200">
                        Inactivo
                      </span>
                    )}
                  </Td>

                  <Td>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                      >
                        Editar
                      </button>

                      {activo ? (
                        <button
                          onClick={() => doInactivar(p)}
                          className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-white transition"
                          style={{
                            backgroundColor: `${WINE}1A`, 
                            borderColor: `${WINE}4D`, 
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget.style.backgroundColor = `${WINE}33`);
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget.style.backgroundColor = `${WINE}1A`);
                          }}
                        >
                          Inactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => doReactivar(p)}
                          className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-white transition"
                          style={{
                            backgroundColor: `${WINE}1A`,
                            borderColor: `${WINE}4D`,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget.style.backgroundColor = `${WINE}33`);
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget.style.backgroundColor = `${WINE}1A`);
                          }}
                        >
                          Reactivar
                        </button>
                      )}

                      <button
                        onClick={() => abrirModalStock(p)}
                        className="rounded-xl border px-3 py-1.5 text-xs font-medium text-white transition"
                        style={{
                          backgroundColor: `${WINE}14`,
                          borderColor: "rgba(255,255,255,0.12)",
                        }}
                      >
                        Editar stock
                      </button>
                    </div>
                  </Td>

                  <Td>
                    <button
                      onClick={() => showDetalle(p.productoID)}
                      className="rounded-xl border px-3 py-1.5 text-xs font-medium text-white transition"
                      style={{
                        backgroundColor: `${WINE}14`,
                        borderColor: "rgba(255,255,255,0.12)",
                      }}
                    >
                      Ver detalle
                    </button>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </CardTable>

      {detalleId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDetalle();
          }}
        >
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#121618] p-6 shadow-2xl">
            <button
              onClick={closeDetalle}
              className="absolute right-3 top-3 rounded-full px-2 text-white/80 hover:bg-white/10"
              aria-label="Cerrar"
            >
              ×
            </button>
            <h3 className="mb-4 text-lg font-semibold text-white">Detalle del producto #{detalleId}</h3>
            {detalleLoading ? (
              <p className="text-sm text-[#8B9AA0]">Cargando detalle…</p>
            ) : detalleError ? (
              <p className="text-sm text-rose-200">Error cargando el detalle.</p>
            ) : detalle ? (
              <div className="grid grid-cols-1 gap-3 text-sm text-[#E6E9EA] sm:grid-cols-2">
                <Info label="Código interno" value={(detalle as any)?.codigoInterno} />
                <Info label="Peso (kg)" value={(detalle as any)?.peso} />
                <Info label="Largo (cm)" value={(detalle as any)?.largo} />
                <Info label="Alto (cm)" value={(detalle as any)?.alto} />
                <Info label="Ancho (cm)" value={(detalle as any)?.ancho} />
                <Info label="Unidad Almacenamiento ID" value={(detalle as any)?.unidadAlmacenamientoID} />
                <Info label="Precio costo" value={(detalle as any)?.precioCosto} />
                <Info label="Precio venta" value={(detalle as any)?.precioVenta} />
                {(detalle as any)?.descripcion && (
                  <div className="pt-2 sm:col-span-2">
                    <Info label="Descripción" value={(detalle as any)?.descripcion} full />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {editModal.open && (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) closeEdit();
    }}
  >
    <div
      className="w-full max-w-6xl rounded-2xl border border-white/10 bg-[#121618] p-5 text-white shadow-2xl"
      onMouseDown={(e) => e.stopPropagation()}
      style={{ maxHeight: "86vh" }}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Editar producto</h2>
        <button
          type="button"
          className="rounded-xl bg-[#A30862] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95"
          onClick={closeEdit}
        >
          Cerrar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Nombre*">
          <Input
            value={editModal.nombre}
            onChange={(e) => setEditModal((v) => ({ ...v, nombre: e.target.value }))}
          />
        </Field>

        <Field label="Descuento (%)">
          <Input
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={editModal.descuento ?? 0}
            onChange={(e) => setEditModal((v) => ({ ...v, descuento: Number(e.target.value) }))}
          />
        </Field>

        <Field label="Precio venta*">
          <Input
            type="number"
            step="0.01"
            value={editModal.precioVenta ?? 0}
            onChange={(e) => setEditModal((v) => ({ ...v, precioVenta: Number(e.target.value) }))}
          />
        </Field>

        <Field label="Precio costo">
          <Input
            type="number"
            step="0.01"
            value={editModal.precioCosto ?? 0}
            onChange={(e) => setEditModal((v) => ({ ...v, precioCosto: Number(e.target.value) }))}
          />
        </Field>

        <Field label="SKU">
          <Input
            value={editModal.sku ?? ""}
            onChange={(e) => setEditModal((v) => ({ ...v, sku: e.target.value }))}
          />
        </Field>

        <Field label="Código interno">
          <Input
            value={editModal.codigoInterno ?? ""}
            onChange={(e) => setEditModal((v) => ({ ...v, codigoInterno: e.target.value }))}
          />
        </Field>

        <Field label="Unidad de almacenamiento ID">
          <Input
            type="number"
            value={editModal.unidadAlmacenamientoID ?? 0}
            onChange={(e) =>
              setEditModal((v) => ({
                ...v,
                unidadAlmacenamientoID: Number(e.target.value) || null,
              }))
            }
          />
        </Field>

        <Field label="Peso (kg)">
          <Input
            type="number"
            step="0.01"
            value={editModal.peso ?? 0}
            onChange={(e) => setEditModal((v) => ({ ...v, peso: Number(e.target.value) }))}
          />
        </Field>

        <Field label="Largo (cm)">
          <Input
            type="number"
            step="0.01"
            value={editModal.largo ?? 0}
            onChange={(e) => setEditModal((v) => ({ ...v, largo: Number(e.target.value) }))}
          />
        </Field>

        <Field label="Alto (cm)">
          <Input
            type="number"
            step="0.01"
            value={editModal.alto ?? 0}
            onChange={(e) => setEditModal((v) => ({ ...v, alto: Number(e.target.value) }))}
          />
        </Field>

        <Field label="Ancho (cm)">
          <Input
            type="number"
            step="0.01"
            value={editModal.ancho ?? 0}
            onChange={(e) => setEditModal((v) => ({ ...v, ancho: Number(e.target.value) }))}
          />
        </Field>

        <Field label="Descripción" full>
          <Textarea
            value={editModal.descripcion}
            onChange={(e) => setEditModal((v) => ({ ...v, descripcion: e.target.value }))}
            className="min-h-[92px]"
          />
        </Field>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          onClick={closeEdit}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-xl bg-[#A30862] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
          disabled={updating}
          onClick={saveEdit}
        >
          {updating ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  </div>
)}


      {openEditarStock !== null && (
        <EditarCantidadModal
          open={openEditarStock !== null}
          onClose={() => setOpenEditarStock(null)}
          productoID={openEditarStock.productoID}
          productoNombre={openEditarStock.productoNombre ?? ""}
          bodegas={bodegas}
          initialBodegaID={openEditarStock.bodegaID ?? null}
          onSaved={async () => {
            await load();
            setOpenEditarStock(null);
          }}
        />
      )}
    </div>
  );
}

const Info: React.FC<{ label: string; value: any; full?: boolean }> = ({ label, value, full = false }) => (
  <p className={full ? "col-span-2" : ""}>
    <span className="text-[#8B9AA0]">{label}:</span> <span className="text-white">{value ?? "—"}</span>
  </p>
);

const Field: React.FC<React.PropsWithChildren<{ label: string; full?: boolean }>> = ({ label, full, children }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <div className="mb-1 text-xs text-white/70">{label}</div>
    {children}
  </div>
);

const baseInput =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition " +
  "focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40 placeholder:text-white/40";

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={[baseInput, props.className ?? ""].join(" ")} />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={["min-h-[110px]", baseInput, props.className ?? ""].join(" ")} />
);
