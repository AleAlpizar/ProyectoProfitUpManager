"use client";
import React from "react";
import SectionHeader from "../../../components/SectionHeader";
import ProductosTable from "../../../components/productos/ProductosTable";

export default function ProductosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-6">
      <div className="mb-4">
        <SectionHeader
          title="Productos"
          subtitle="Listado de productos disponibles"
        />
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#121618]/80 p-3 shadow-[0_14px_40px_rgba(0,0,0,.18)] md:p-4">
        <ProductosTable filtroId="" />
      </div>
    </div>
  );
}