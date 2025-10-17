import React from "react";
import Link from "next/link";
import SectionHeader from "../../../components/SectionHeader";

export default function ProductosHomePage() {
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <SectionHeader title="Productos" subtitle="Gestión de artículos del inventario" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/inventario/productos/registrar" className="block">
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 transition hover:bg-emerald-400/20">
            <h3 className="text-lg font-semibold text-emerald-300">Registrar producto</h3>
            <p className="mt-1 text-sm text-gray-300">
              Da de alta un nuevo artículo y sus datos completos.
            </p>
          </div>
        </Link>

        <Link href="/inventario/productos/gestion" className="block">
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 transition hover:bg-amber-400/20">
            <h3 className="text-lg font-semibold text-amber-300">Gestionar inventario</h3>
            <p className="mt-1 text-sm text-gray-300">
              Asigna productos a bodegas, ajusta cantidades e inactiva artículos.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
