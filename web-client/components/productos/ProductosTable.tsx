"use client";

import React, { useEffect, useState } from "react";
import { useProductosMini, ProductoMini } from "@/components/hooks/useProductosMini";
import { useProductoUpdate } from "@/components/hooks/useProductoUpdate";
import { useProductoDetalle } from "@/components/hooks/useProductoDetalle";

type Props = { filtroId: number | "" };

export default function ProductosTable({ filtroId }: Props) {
  const { data: productos, load, loading, error } = useProductosMini();
  const { updateProducto, loading: updating, error: updateError } = useProductoUpdate();
  const { detalle, loadDetalle, loading: detalleLoading, error: detalleError } = useProductoDetalle();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<ProductoMini>>({});
  const [detalleId, setDetalleId] = useState<number | null>(null);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const filteredProductos = filtroId === ""
    ? productos
    : productos.filter((p) => p.productoID === Number(filtroId));

  const startEditing = (p: ProductoMini) => {
    setEditingId(p.productoID);
    setEditValues({ nombre: p.nombre, descripcion: p.descripcion });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEditing = async (id: number) => {
    const success = await updateProducto(id, editValues);
    if (success) {
      productos.forEach((p) => {
        if (p.productoID === id) {
          p.nombre = editValues.nombre ?? p.nombre;
          p.descripcion = editValues.descripcion ?? p.descripcion;
        }
      });
      setEditingId(null);
      setEditValues({});
      await load();
    } else {
      alert(updateError ?? "No se pudo guardar");
    }
  };

  const showDetalle = async (id: number) => {
    setDetalleId(id);
    await loadDetalle(id);
  };

  const closeDetalle = () => {
    setDetalleId(null);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700 mt-4">
      <table className="min-w-full text-sm text-gray-200">
        <thead className="bg-white/5 text-gray-400">
          <tr className="text-left">
            <th className="px-4 py-2">ProductoID</th>
            <th className="px-4 py-2">SKU</th>
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2">Descripción</th>
            <th className="px-4 py-2">Acciones</th>
            <th className="px-4 py-2">Detalles</th>
          </tr>
        </thead>
        <tbody>
          {loading && productos.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-400">Cargando…</td>
            </tr>
          ) : filteredProductos.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No hay productos registrados.</td>
            </tr>
          ) : (
            filteredProductos.map((p) => (
              <tr key={p.productoID} className="border-t border-gray-700">
                <td className="px-4 py-2">{p.productoID}</td>
                <td className="px-4 py-2">{p.sku}</td>
                <td className="px-4 py-2">
                  {editingId === p.productoID ? (
                    <input
                      className="bg-gray-900 text-white px-2 py-1 rounded"
                      value={editValues.nombre ?? ""}
                      onChange={(e) => setEditValues(v => ({ ...v, nombre: e.target.value }))}
                    />
                  ) : p.nombre}
                </td>
                <td className="px-4 py-2">
                  {editingId === p.productoID ? (
                    <input
                      className="bg-gray-900 text-white px-2 py-1 rounded"
                      value={editValues.descripcion ?? ""}
                      onChange={(e) => setEditValues(v => ({ ...v, descripcion: e.target.value }))}
                    />
                  ) : p.descripcion}
                </td>
                <td className="px-4 py-2 space-x-2">
                  {editingId === p.productoID ? (
                    <>
                      <button onClick={() => saveEditing(p.productoID)} className="text-green-400 hover:underline" disabled={updating}>Guardar</button>
                      <button onClick={cancelEditing} className="text-red-400 hover:underline" disabled={updating}>Cancelar</button>
                    </>
                  ) : (
                    <button onClick={() => startEditing(p)} className="text-blue-400 hover:underline">Editar</button>
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => showDetalle(p.productoID)}
                    className="text-yellow-400 hover:underline"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {detalleId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-800 text-gray-200 rounded-xl p-6 w-11/12 max-w-2xl relative">
            <button
              onClick={closeDetalle}
              className="absolute top-2 right-2 text-red-400 text-lg font-bold"
            >
              ×
            </button>
            {detalleLoading ? (
              <p>Cargando detalle…</p>
            ) : detalleError ? (
              <p>Error cargando el detalle</p>
            ) : detalle ? (
              <div className="space-y-2 text-sm">
                <p><strong>Código interno:</strong> {detalle.codigoInterno ?? "-"}</p>
                <p><strong>Peso (kg):</strong> {detalle.peso ?? "-"}</p>
                <p><strong>Largo (cm):</strong> {detalle.largo ?? "-"}</p>
                <p><strong>Alto (cm):</strong> {detalle.alto ?? "-"}</p>
                <p><strong>Ancho (cm):</strong> {detalle.ancho ?? "-"}</p>
                <p><strong>Unidad Almacenamiento ID:</strong> {detalle.unidadAlmacenamientoID ?? "-"}</p>
                <p><strong>Precio costo:</strong> {detalle.precioCosto ?? "-"}</p>
                <p><strong>Precio venta:</strong> {detalle.precioVenta ?? "-"}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

