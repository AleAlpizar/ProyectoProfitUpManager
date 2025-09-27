"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useProductosMini, ProductoMini } from "@/components/hooks/useProductosMini";
import { useProductoUpdate } from "@/components/hooks/useProductoUpdate";
import { useProductoDetalle, ProductoDetalle } from "@/components/hooks/useProductoDetalle";

type Option = { value: number; label: string };

export default function ProductosPage() {
  const { data: productos, load, loading, error } = useProductosMini();
  const { updateProducto, loading: updating, error: updateError } = useProductoUpdate();
  const { detalle, loadDetalle, loading: loadingDetalle, error: errorDetalle } = useProductoDetalle();

  const [productoId, setProductoId] = useState<number | "">("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<ProductoMini>>({});
  const [modalOpen, setModalOpen] = useState(false);

  const productoOptions: Option[] = useMemo(
    () =>
      (productos || []).map((p) => ({
        value: p.productoID,
        label: p.sku ? `[${p.sku}] ${p.nombre}` : p.nombre,
      })),
    [productos]
  );

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const filteredProductos =
    productoId === ""
      ? productos
      : productos.filter((p) => p.productoID === Number(productoId));

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
    await loadDetalle(id);
    setModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white/90">Productos</h1>
        <p className="text-sm text-gray-400">Listado de productos disponibles.</p>
      </header>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex flex-col gap-1 md:flex-row md:gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Producto</label>
            <select
              value={productoId}
              onChange={(e) =>
                setProductoId(e.target.value === "" ? "" : Number(e.target.value))
              }
              disabled={loading}
              className="rounded-xl border border-gray-700 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-gray-500"
            >
              <option value="">Todos</option>
              {productoOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => load()}
          disabled={loading}
          className="h-[38px] rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Refrescando…" : "Refrescar"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
          ❌ Error cargando productos
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-800 mt-4">
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
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            ) : filteredProductos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              filteredProductos.map((p) => (
                <tr key={p.productoID} className="border-t border-gray-800 hover:bg-white/5">
                  <td className="px-4 py-2">{p.productoID}</td>
                  <td className="px-4 py-2">{p.sku}</td>
                  <td className="px-4 py-2">
                    {editingId === p.productoID ? (
                      <input
                        className="bg-gray-900 text-white px-2 py-1 rounded"
                        value={editValues.nombre ?? ""}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, nombre: e.target.value }))
                        }
                      />
                    ) : (
                      p.nombre
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === p.productoID ? (
                      <input
                        className="bg-gray-900 text-white px-2 py-1 rounded"
                        value={editValues.descripcion ?? ""}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, descripcion: e.target.value }))
                        }
                      />
                    ) : (
                      p.descripcion
                    )}
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    {editingId === p.productoID ? (
                      <>
                        <button
                          onClick={() => saveEditing(p.productoID)}
                          className="text-green-400 hover:underline"
                          disabled={updating}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-red-400 hover:underline"
                          disabled={updating}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditing(p)}
                        className="text-blue-400 hover:underline"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => showDetalle(p.productoID)}
                      className="text-yellow-400 hover:underline"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de detalle */}
      {modalOpen && detalle && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-96 relative">
            <h2 className="text-xl font-bold mb-4">Detalle del Producto</h2>

            {loadingDetalle ? (
              <p>Cargando…</p>
            ) : errorDetalle ? (
              <p className="text-red-400">{errorDetalle}</p>
            ) : (
              <>
                <p>Código Interno: {detalle.codigoInterno}</p>
                <p>Peso: {detalle.peso}</p>
                <p>Dimensiones: {detalle.largo} x {detalle.alto} x {detalle.ancho}</p>
                <p>Unidad: {detalle.unidadAlmacenamientoID}</p>
                <p>Precio Costo: {detalle.precioCosto}</p>
                <p>Precio Venta: {detalle.precioVenta}</p>
              </>
            )}

            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2 text-red-400 hover:underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




