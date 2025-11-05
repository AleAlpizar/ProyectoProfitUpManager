import React from "react";
import FeatureCard from "../../../components/inventario/FeatureCard";
import InventoryHeader from "../../../components/inventario/InventoryHeader";


export default function InventarioHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <InventoryHeader />

      <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        Accede rápidamente a los módulos de inventario.
      </div>

      <section
        aria-label="Accesos de inventario"
        className="mt-6 grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3"
        role="list"
      >
        <FeatureCard
          title="Alta Productos"
          desc="Alta y gestión de productos."
          href="/inventario/productos"
          cta="Ir a Productos"
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
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          }
        />

        <FeatureCard
          title="Bodegas"
          desc="Centros de almacenamiento."
          href="/inventario/bodegas"
          cta="Ver Bodegas"
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
              <path d="M3 9l9-6 9 6v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" />
              <path d="M9 22V12h6v10" />
            </svg>
          }
        />

        <FeatureCard
          title="Detalles Productos"
          desc="Editar producto y ver datos."
          href="/inventario/existencias"
          cta="Ver Existencias"
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
              <path d="M3 3v18h18" />
              <path d="M7 13l3 3 7-7" />
            </svg>
          }
        />
      </section>
    </div>
  );
}
