import React from "react";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";

type CardProps = {
  title: string;
  desc: string;
  href: string;
  cta: string;
};

function FeatureCard({ title, desc, href, cta }: CardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm transition hover:border-white/20 hover:bg-white/[0.07]">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-400">{desc}</p>

      <Link href={href} legacyBehavior>
        <a className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/60">
          {cta}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>
      </Link>
    </div>
  );
}

export default function InventarioHubPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <SectionHeader
        title="Inventario"
        subtitle="Gestión de productos y movimientos"
      />

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <FeatureCard
          title="Productos"
          desc="Alta y gestión de artículos."
          href="/inventario/productos"
          cta="Ir a Productos"
        />
        <FeatureCard
          title="Bodegas"
          desc="Centros de almacenamiento."
          href="/inventario/bodegas"
          cta="Ver Bodegas"
        />
        <FeatureCard
          title="Existencias"
          desc="Stock por producto y bodega."
          href="/inventario/existencias"
          cta="Ver Existencias"
        />
      </div>
    </div>
  );
}
