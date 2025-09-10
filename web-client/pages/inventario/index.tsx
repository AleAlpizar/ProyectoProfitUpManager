import React from "react";
import SectionHeader from "../../components/SectionHeader";
import Link from "next/link";

export default function InventarioHome() {
    return (
        <div className="p-6">
            <SectionHeader title="Módulo de Inventario" />

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
                <h2 className="text-lg font-semibold mb-4">Acciones rápidas</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <CardLink href="/inventario/productos" label="Productos" subtitle="Gestión" />
                    <CardLink href="/inventario/bodegas" label="Bodegas" subtitle="Ubicaciones" />
                    <CardLink href="/inventario/existencias" label="Existencias" subtitle="Consulta" />
                </div>
            </div>
        </div>
    );
}

function CardLink({
    href,
    label,
    subtitle,
}: {
    href: string;
    label: string;
    subtitle: string;
}) {
    return (
        <Link href={href} legacyBehavior>
            <a className="flex flex-col gap-1 p-4 rounded-xl border border-neutral-200 hover:shadow-md transition bg-white hover:bg-neutral-50">
                <span className="text-xs text-neutral-500">{subtitle}</span>
                <span className="font-semibold text-neutral-800">{label}</span>
            </a>
        </Link>
    );
}
