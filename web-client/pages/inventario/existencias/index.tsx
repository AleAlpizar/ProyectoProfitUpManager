"use client";
import React from "react";
import SectionHeader from "../../../components/SectionHeader";
import ProductosTable from "../../../components/productos/ProductosTable";

export default function ProductosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:px-6 md:py-6">
      <SectionHeader
        title="Productos"
        subtitle="Listado de productos disponibles"
      />

      <div className="-mt-3">
        <ProductosTable filtroId="" />
      </div>
    </div>
  );
}
