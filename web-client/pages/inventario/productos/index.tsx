import React from "react";
import Link from "next/link";
import SectionHeader from "../../../components/SectionHeader";

export default function ProductosHomePage() {
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <SectionHeader
        title="Productos"
        subtitle="Gestión de artículos del inventario"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/inventario/productos/registrar" className="block">
          <div
            className={[
              "rounded-2xl border p-4 transition",
              "border-[#A30862]/30",
              "bg-[linear-gradient(135deg,rgba(163,8,98,0.20)_0%,rgba(163,8,98,0.12)_60%,rgba(163,8,98,0.10)_100%)]",
              "hover:shadow-[0_10px_30px_rgba(163,8,98,0.20)] hover:border-[#A30862]/50",
            ].join(" ")}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#A30862]/20 px-2.5 py-1 text-[11px] font-medium text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A30862]" />
              Acción
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Registrar producto
            </h3>
            <p className="mt-1 text-sm text-[#F2C7DA]">
              Da de alta un nuevo artículo y sus datos completos.
            </p>
          </div>
        </Link>

        <Link href="/inventario/productos/gestion" className="block">
          <div
            className={[
              "rounded-2xl border p-4 transition",
              "border-[#A30862]/30",
              "bg-[linear-gradient(135deg,rgba(163,8,98,0.18)_0%,rgba(163,8,98,0.10)_60%,rgba(163,8,98,0.08)_100%)]",
              "hover:shadow-[0_10px_30px_rgba(163,8,98,0.20)] hover:border-[#A30862]/50",
            ].join(" ")}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#A30862]/20 px-2.5 py-1 text-[11px] font-medium text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A30862]" />
              Gestión
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Gestionar inventario
            </h3>
            <p className="mt-1 text-sm text-[#F2C7DA]">
              Asigna productos a bodegas, ajusta cantidades e inactiva artículos.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
