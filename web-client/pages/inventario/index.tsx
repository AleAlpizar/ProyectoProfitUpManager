"use client";

import React from "react";
import { useInventarioAccess } from "@/components/hooks/useInventarioAccess";
import SectionHeader from "@/components/SectionHeader";
import Spinner from "@/components/Spinner";
import Alert from "@/components/Alert";
import Link from "next/link";

export default function InventarioHomePage() {
  const { allowed, loading, error, reload } = useInventarioAccess("Leer");

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader title="Inventario" subtitle="Gestión de productos y movimientos" />

      {loading && (
        <div className="mb-4">
          <Spinner />
        </div>
      )}

      {!loading && error && (
  <div className="mb-4">
    <Alert type="error">
      {typeof error === "string"
        ? error
        : (error as any)?.message ?? "No se pudo validar el acceso."}
      <button className="ml-3 underline" onClick={reload}>
        Reintentar
      </button>
    </Alert>
  </div>
)}

      {!loading && !error && allowed === false && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700">
          <div className="font-medium mb-1">Acceso denegado</div>
          <div className="text-sm">
            No cuentas con permisos para acceder al módulo de Inventario. Si crees que es un error,
            contacta al administrador del sistema.
          </div>
        </div>
      )}

      {!loading && !error && allowed === true && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/inventario/productos"
            className="block rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5 hover:bg-emerald-900/30 transition"
          >
            <div className="text-lg font-semibold text-emerald-200">Productos</div>
            <div className="mt-1 text-sm text-emerald-300/80">
              Alta y administración de artículos.
            </div>
          </Link>

          <Link
            href="/inventario/bodegas"
            className="block rounded-xl border border-sky-800/30 bg-sky-900/20 p-5 hover:bg-sky-900/30 transition"
          >
            <div className="text-lg font-semibold text-sky-200">Bodegas</div>
            <div className="mt-1 text-sm text-sky-300/80">
              Consulta y mantenimiento de bodegas.
            </div>
          </Link>

          <Link
            href="/inventario/existencias"
            className="block rounded-xl border border-indigo-800/30 bg-indigo-900/20 p-5 hover:bg-indigo-900/30 transition"
          >
            <div className="text-lg font-semibold text-indigo-200">Existencias</div>
            <div className="mt-1 text-sm text-indigo-300/80">
              Stock en tiempo real por producto y bodega.
            </div>
          </Link>

        </div>
      )}
    </div>
  );
}
