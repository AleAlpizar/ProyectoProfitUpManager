import React from "react";
import Link from "next/link";
import SectionHeader from "../../../components/SectionHeader";

export default function ProductosHomePage() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader
        title="Productos"
        subtitle="Gestión de artículos del inventario"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/inventario/productos/registrar"
          className="group block focus:outline-none"
          aria-label="Registrar producto"
        >
          <div
            className={[
              "relative overflow-hidden rounded-3xl border p-6 md:p-8 transition",
              "border-[#A30862]/30",
              "bg-[linear-gradient(135deg,rgba(163,8,98,0.22)_0%,rgba(163,8,98,0.12)_55%,rgba(163,8,98,0.10)_100%)]",
              "hover:shadow-[0_14px_44px_rgba(163,8,98,0.28)] hover:border-[#A30862]/50",
              "focus-visible:ring-2 focus-visible:ring-[#A30862]/50",
              "min-h-[200px] md:min-h-[240px] flex flex-col justify-between",
            ].join(" ")}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#A30862]/25 px-3 py-1.5 text-[11px] font-medium text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A30862]" />
              Acción
            </div>

            <div className="mt-4">
              <h3 className="text-xl md:text-2xl font-semibold text-white">
                Registrar producto
              </h3>
              <p className="mt-2 text-sm md:text-base text-[#F2C7DA]">
                Da de alta un nuevo artículo y completa sus datos principales.
              </p>
            </div>

            <span
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs md:text-sm font-medium text-white transition group-hover:bg-white/10"
              aria-hidden="true"
            >
              Comenzar
              <svg
                className="h-4 w-4 opacity-80"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>

            <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#A30862]/20 blur-2xl" />
          </div>
        </Link>

        <Link
          href="/inventario/existencias"
          className="group block focus:outline-none"
          aria-label="Ver existencias por bodega"
        >
          <div
            className={[
              "relative overflow-hidden rounded-3xl border p-6 md:p-8 transition",
              "border-[#A30862]/30",
              "bg-[linear-gradient(135deg,rgba(163,8,98,0.18)_0%,rgba(163,8,98,0.10)_55%,rgba(163,8,98,0.08)_100%)]",
              "hover:shadow-[0_14px_44px_rgba(163,8,98,0.26)] hover:border-[#A30862]/50",
              "focus-visible:ring-2 focus-visible:ring-[#A30862]/50",
              "min-h-[200px] md:min-h-[240px] flex flex-col justify-between",
            ].join(" ")}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#A30862]/20 px-3 py-1.5 text-[11px] font-medium text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A30862]" />
              Navegación
            </div>

            <div className="mt-4">
              <h3 className="text-xl md:text-2xl font-semibold text-white">
                Existencias por bodega
              </h3>
              <p className="mt-2 text-sm md:text-base text-[#F2C7DA]">
                Consulta y ajusta el stock de productos en cada bodega.
              </p>
            </div>

            <span
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs md:text-sm font-medium text-white transition group-hover:bg-white/10"
              aria-hidden="true"
            >
              Ir a existencias
              <svg
                className="h-4 w-4 opacity-80"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>

            <div className="pointer-events-none absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-[#A30862]/20 blur-2xl" />
          </div>
        </Link>

        <Link
          href="/inventario/historial/page"
          className="group block focus:outline-none"
          aria-label="Ver historial de movimientos de inventario"
        >
          <div
            className={[
              "relative overflow-hidden rounded-3xl border p-6 md:p-8 transition",
              "border-[#A30862]/30",
              "bg-[linear-gradient(135deg,rgba(163,8,98,0.20)_0%,rgba(163,8,98,0.12)_55%,rgba(163,8,98,0.08)_100%)]",
              "hover:shadow-[0_14px_44px_rgba(163,8,98,0.28)] hover:border-[#A30862]/50",
              "focus-visible:ring-2 focus-visible:ring-[#A30862]/50",
              "min-h-[200px] md:min-h-[240px] flex flex-col justify-between",
            ].join(" ")}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#A30862]/22 px-3 py-1.5 text-[11px] font-medium text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A30862]" />
              Historial
            </div>

            <div className="mt-4">
              <h3 className="text-xl md:text-2xl font-semibold text-white">
                Historial de movimientos
              </h3>
              <p className="mt-2 text-sm md:text-base text-[#F2C7DA]">
                Revisa entradas, salidas y ajustes de inventario por bodega y producto.
              </p>
            </div>

            <span
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs md:text-sm font-medium text-white transition group-hover:bg-white/10"
              aria-hidden="true"
            >
              Ver historial
              <svg
                className="h-4 w-4 opacity-80"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>

            <div className="pointer-events-none absolute right-[-40px] bottom-[-40px] h-48 w-48 rounded-full bg-[#A30862]/18 blur-2xl" />
          </div>
        </Link>
      </div>
    </div>
  );
}
