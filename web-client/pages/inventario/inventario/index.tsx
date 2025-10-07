import React from "react";
import FeatureCard from "@/components/inventario/FeatureCard";
import InventoryHeader from "@/components/inventario/InventoryHeader";

export default function InventarioHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <InventoryHeader />

      <section className="mt-6 grid gap-5 sm:gap-6 md:grid-cols-3">
        <FeatureCard
          title="Productos"
          desc="Alta y gestión de artículos."
          href="/inventario/productos"
          cta="Ir a Productos"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-6 9 6v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" />
              <path d="M9 22V12h6v10" />
            </svg>
          }
        />

        <FeatureCard
          title="Existencias"
          desc="Stock por producto y bodega."
          href="/inventario/existencias"
          cta="Ver Existencias"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M7 13l3 3 7-7" />
            </svg>
          }
        />
      </section>
    </div>
  );
}
