"use client";

import React from "react";
import FeatureCard from "../../components/inventario/FeatureCard";

export default function VentasHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <header className="border-b border-white/5 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="text-[#A30862]">Ventas</span>
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Accede rápidamente a los módulos de ventas.
        </p>
      </header>

      <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        Elige una opción del módulo de ventas.
      </div>

      <section
        aria-label="Accesos de ventas"
        className="mt-6 grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2"
        role="list"
      >
        <FeatureCard
          title="Registrar venta"
          desc="Crear una nueva venta al cliente."
          href="/ventas/registrar"
          cta="Ir a registro"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M3 5h18v4H3z" />
              <path d="M5 9v10h14V9" />
              <path d="M9 13h6" />
              <path d="M11 11v4" />
            </svg>
          }
        />

        <FeatureCard
          title="Historial de ventas"
          desc="Consulta y detalla ventas realizadas."
          href="/ventas/historial"
          cta="Ver historial"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          }
        />
      </section>
    </div>
  );
}
