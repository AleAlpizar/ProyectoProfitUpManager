"use client";
import React from "react";
import EditarCantidadModal from "@/components/inventario/EditarCantidadModal";

import { useProductosMini, ProductoMini } from "../hooks/useProductosMini";
import { useProductoUpdate } from "../hooks/useProductoUpdate";
import { useProductoDetalle } from "../hooks/useProductoDetalle";
import { useProductoInactivar } from "../hooks/useProductoInactivar";
import { useBodegas } from "../hooks/useBodegas";

type Props = { filtroId: number | "" };

export default function ProductosTable({ filtroId }: Props) {
  const { data: productos, load, loading, error } = useProductosMini();
  const { updateProducto, loading: updating, error: updateError } = useProductoUpdate();
  const { detalle, loadDetalle, loading: detalleLoading, error: detalleError } = useProductoDetalle();
  const { inactivar, loading: inactivando } = useProductoInactivar();
  const { data: bodegas = [] } = useBodegas();

  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editValues, setEditValues] = React.useState<Partial<Pick<ProductoMini, "nombre" | "descripcion" | "descuento">>>({});
  const [detalleId, setDetalleId] = React.useState<number | null>(null);
  const [openEditarStock, setOpenEditarStock] = React.useState<{ productoID: number; bodegaID?: number | null; productoNombre?: string; } | null>(null);

  React.useEffect(() => { load().catch(() => {}); }, [load]);

  const filteredProductos = React.useMemo(() => {
    if (!productos || productos.length === 0) return [];
    if (filtroId === "") return productos;
    const id = Number(filtroId);
    return productos.filter((p) => p.productoID === id);
  }, [productos, filtroId]);

  const startEditing = (p: ProductoMini) => {
    setEditingId(p.productoID);
    setEditValues({ nombre: p.nombre, descripcion: p.descripcion ?? "", descuento: p.descuento ?? 0 });
  };
  const cancelEditing = () => { setEditingId(null); setEditValues({}); };

  const saveEditing = async (id: number) => {
    const nombre = (editValues.nombre ?? "").trim();
    const descripcion = (editValues.descripcion ?? "").trim();
    const descuento = editValues.descuento ?? 0;
    if (!nombre) { alert("El nombre no puede estar vacío."); return; }
    const ok = await updateProducto(id, { nombre, descripcion, descuento });
    if (ok) { await load(); setEditingId(null); setEditValues({}); } 
    else { alert(updateError ?? "No se pudo guardar"); }
  };

  const showDetalle = async (id: number) => { setDetalleId(id); await loadDetalle(id); };
  const closeDetalle = () => setDetalleId(null);

  const descripcionDet: string | null = React.useMemo(() => {
    if (!detalle) return null;
    const anyDet = detalle as any;
    return anyDet?.descripcion ?? anyDet?.descripcionGeneral ?? anyDet?.detalle ?? null;
  }, [detalle]);

  const abrirModalStock = (row: ProductoMini) => setOpenEditarStock({ productoID: row.productoID, productoNombre: row.nombre, bodegaID: null });
  const confirmarInactivar = async (row: ProductoMini) => { if (!confirm(`¿Inactivar el producto "${row.nombre}"?`)) return; const { ok } = await inactivar(row.productoID); if (ok) await load(); };

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-white/5">
      {error && <div className="px-4 py-2 text-sm text-red-300">Error al cargar productos.</div>}
      {updateError && <div className="px-4 py-2 text-sm text-red-300">Error guardando cambios.</div>}

      <table className="min-w-full text-sm text-gray-200">
        <thead className="bg-black/30 text-gray-400">
          <tr className="text-left">
            <Th>ProductoID</Th>
            <Th>SKU</Th>
            <Th>Nombre</Th>
            <Th>Descripción</Th>
            <Th>Descuento (%)</Th>
            <Th>Acciones</Th>
            <Th>Detalles</Th>
          </tr>
        </thead>

        <tbody>
          {loading && (!productos || productos.length === 0) ? (
            <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Cargando…</td></tr>
          ) : filteredProductos.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No hay productos registrados.</td></tr>
          ) : filteredProductos.map((p) => {
            const isEditing = editingId === p.productoID;
            return (
              <tr key={p.productoID} className="border-t border-white/10 hover:bg-white/[0.03]">
                <Td>{p.productoID}</Td>
                <Td mono>{p.sku ?? "—"}</Td>

                <Td>
                  {isEditing ? (
                    <input className="w-full rounded-lg border bg-neutral-900 px-2 py-1 text-white outline-none" value={editValues.nombre ?? ""} onChange={(e) => setEditValues((v) => ({ ...v, nombre: e.target.value }))} />
                  ) : (<span className="font-medium text-gray-100">{p.nombre}</span>)}
                </Td>

                <Td>
                  {isEditing ? (
                    <input className="w-full rounded-lg border bg-neutral-900 px-2 py-1 text-white outline-none" value={editValues.descripcion ?? ""} onChange={(e) => setEditValues((v) => ({ ...v, descripcion: e.target.value }))} />
                  ) : (<span className="text-gray-300">{p.descripcion ?? "—"}</span>)}
                </Td>

                <Td>
                  {isEditing ? (
                    <input type="number" min={0} max={100} className="w-full rounded-lg border bg-neutral-900 px-2 py-1 text-white outline-none" value={editValues.descuento ?? 0} onChange={(e) => setEditValues((v) => ({ ...v, descuento: Number(e.target.value) }))} />
                  ) : (<span className="text-gray-300">{p.descuento ?? 0}%</span>)}
                </Td>

                <Td>
                  {isEditing ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <button onClick={() => saveEditing(p.productoID)} disabled={updating} className="rounded-md bg-emerald-600 px-3 py-1 text-xs text-white">{updating ? "Guardando…" : "Guardar"}</button>
                      <button onClick={cancelEditing} disabled={updating} className="rounded-md bg-red-600/80 px-3 py-1 text-xs text-white">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => startEditing(p)} className="rounded-md border px-3 py-1 text-xs text-[#A30862]">Editar</button>
                      <button onClick={() => abrirModalStock(p)} className="rounded-md border px-3 py-1 text-xs text-amber-300" title="Editar stock por bodega">Editar stock</button>
                      <button onClick={() => confirmarInactivar(p)} disabled={inactivando} className="rounded-md bg-red-600/80 px-3 py-1 text-xs text-white" title="Inactivar producto">{inactivando ? "…" : "Inactivar"}</button>
                    </div>
                  )}
                </Td>

                <Td>
                  <button onClick={() => showDetalle(p.productoID)} className="rounded-md border px-3 py-1 text-xs text-amber-300">Ver detalle</button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {detalleId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) closeDetalle(); }}>
          <div className="relative w-full max-w-2xl rounded-2xl border bg-neutral-900 p-6 shadow-2xl">
            <button onClick={closeDetalle} className="absolute right-3 top-3 rounded-full border text-white/80 hover:bg-white/10">×</button>
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Detalle del producto #{detalleId}</h3>
            {detalleLoading ? (<p className="text-sm text-gray-300">Cargando detalle…</p>) :
             detalleError ? (<p className="text-sm text-red-300">Error cargando el detalle.</p>) :
             detalle ? (<div className="grid grid-cols-1 gap-2 text-sm text-gray-200 sm:grid-cols-2">
              <Info label="Código interno" value={(detalle as any)?.codigoInterno} />
              <Info label="Peso (kg)" value={(detalle as any)?.peso} />
              <Info label="Largo (cm)" value={(detalle as any)?.largo} />
              <Info label="Alto (cm)" value={(detalle as any)?.alto} />
              <Info label="Ancho (cm)" value={(detalle as any)?.ancho} />
              <Info label="Unidad Almacenamiento ID" value={(detalle as any)?.unidadAlmacenamientoID} />
              <Info label="Precio costo" value={(detalle as any)?.precioCosto} />
              <Info label="Precio venta" value={(detalle as any)?.precioVenta} />
              {descripcionDet && <div className="pt-2 sm:col-span-2"><Info label="Descripción" value={descripcionDet} full /></div>}
             </div>) : null}
          </div>
        </div>
      )}

      {openEditarStock !== null && (
        <EditarCantidadModal open={openEditarStock !== null} onClose={() => setOpenEditarStock(null)} productoID={openEditarStock.productoID} productoNombre={openEditarStock.productoNombre ?? ""} bodegas={bodegas} initialBodegaID={openEditarStock.bodegaID ?? null} onSaved={async () => { await load(); setOpenEditarStock(null); }} />
      )}
    </div>
  );
}

const Th: React.FC<React.PropsWithChildren> = ({ children }) => (<th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">{children}</th>);
const Td: React.FC<React.PropsWithChildren<{ mono?: boolean }>> = ({ children, mono = false }) => (<td className={["px-4 py-2 text-sm", mono ? "font-mono text-gray-300" : "text-gray-200"].join(" ")}>{children}</td>);
const Info: React.FC<{ label: string; value: any; full?: boolean }> = ({ label, value, full = false }) => (<p className={full ? "col-span-2" : ""}><span className="text-gray-400">{label}:</span> <span className="text-gray-100">{value ?? "—"}</span></p>);
