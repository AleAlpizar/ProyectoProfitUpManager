"use client";

import React from "react";
import AsignarProductoBodega from "../../../components/inventario/AsignarProductoBodega";
import ProductosTable from "../../../components/productos/ProductosTable";

export default function GestionProductosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,#151A1D_0%,#111417_100%)] px-5 py-5 shadow-[0_16px_40px_rgba(0,0,0,.32)]">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Gestionar inventario
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/65">
          Administra productos y existencias desde un solo lugar.
        </p>
      </div>

      <div className="space-y-6">
        <AsignarProductoBodega />
        <ProductosTable filtroId="" />
      </div>
    </div>
  );
}