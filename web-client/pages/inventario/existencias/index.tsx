"use client";
import React, { useState } from "react";
import SectionHeader from "../../../components/SectionHeader";
import ProductosTable from "../../../components/productos/ProductosTable";
import { useProductosMini } from "../../../components/hooks/useProductosMini";

export default function ProductosPage() {
  const { data: productos, loading } = useProductosMini();
  const [filtroId, setFiltroId] = useState<number | "">("");

  return (
    <div>
      <SectionHeader title="Productos" subtitle="Listado de productos disponibles" />

      <div className="my-4">
        <label className="text-sm text-gray-300">Filtrar por producto</label>
        <select
          value={filtroId}
          onChange={(e) =>
            setFiltroId(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="rounded-xl border border-gray-700 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-gray-500"
        >
          <option value="">Todos</option>
          {productos.map((p) => (
            <option key={p.productoID} value={p.productoID}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <ProductosTable filtroId={filtroId} />
    </div>
  );
}





