"use client";

import React from "react";
import AsignarProductoBodega from "../../../components/inventario/AsignarProductoBodega";
import ProductosTable from "../../../components/productos/ProductosTable";

export default function GestionProductosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Gestionar inventario</h1>
      </header>

      <AsignarProductoBodega />

      <ProductosTable filtroId="" />
    </div>
  );
}
