"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useStock } from "@/components/hooks/useStock";
import { useBodegas } from "@/components/hooks/useBodegas";
import { useProductosMini } from "@/components/hooks/useProductosMini";


type Option = { value: number; label: string };

export default function ExistenciasPage() {
  const { rows, load, loading, error } = useStock();
  const { data: bodegas, loading: loadingBod } = useBodegas();
  const { data: productos, loading: loadingProd, error: prodError } = useProductosMini();

  const [productoId, setProductoId] = useState<number | "">("");
  const [bodegaId, setBodegaId] = useState<number | "">("");

  const productoOptions: Option[] = useMemo(
    () =>
      (productos || []).map((p: any) => ({
        value: p.productoID ?? p.ProductoID,
        label:
          (p.sku ?? p.SKU ? `[${p.sku ?? p.SKU}] ` : "") +
          (p.nombre ?? p.Nombre),
      })),
    [productos]
  );

  const bodegaOptions: Option[] = useMemo(
    () =>
      (bodegas || []).map((b: any) => ({
        value: b.bodegaID ?? b.BodegaID,
        label: b.nombre ?? b.Nombre,
      })),
    [bodegas]
  );

  useEffect(() => {
    load({
      productoId: productoId === "" ? undefined : Number(productoId),
      bodegaId: bodegaId === "" ? undefined : Number(bodegaId),
    }).catch(() => {});
  }, [productoId, bodegaId, load]);

  const totalRegistros = rows.length;
  const totalExistencia = rows.reduce((a, r: any) => a + (Number(r.existencia) || 0), 0);
  const totalDisponible = rows.reduce((a, r: any) => a + (Number(r.disponible) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white/90">Existencias</h1>
        <p className="text-sm text-gray-400">
          Consulta en tiempo real por producto y bodega.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Producto</label>
          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value === "" ? "" : Number(e.target.value))}
            disabled={loadingProd}
            className="rounded-xl border border-gray-700 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-gray-500"
          >
            <option value="">{loadingProd ? "Cargando..." : "Todos"}</option>
            {productoOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Bodega</label>
          <select
            value={bodegaId}
            onChange={(e) => setBodegaId(e.target.value === "" ? "" : Number(e.target.value))}
            disabled={loadingBod}
            className="rounded-xl border border-gray-700 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-gray-500"
          >
            <option value="">{loadingBod ? "Cargando..." : "Todas"}</option>
            {bodegaOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() =>
              load({
                productoId: productoId === "" ? undefined : Number(productoId),
                bodegaId: bodegaId === "" ? undefined : Number(bodegaId),
              })
            }
            disabled={loading}
            className="h-[38px] w-full rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Actualizando…" : "Refrescar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-700 bg-white/5 p-3">
          <div className="text-xs uppercase text-gray-400">Registros</div>
          <div className="text-2xl font-semibold text-white/90">{totalRegistros}</div>
        </div>
        <div className="rounded-xl border border-gray-700 bg-white/5 p-3">
          <div className="text-xs uppercase text-gray-400">Existencia total</div>
          <div className="text-2xl font-semibold text-white/90">{totalExistencia}</div>
        </div>
        <div className="rounded-xl border border-gray-700 bg-white/5 p-3">
          <div className="text-xs uppercase text-gray-400">Disponible total</div>
          <div className="text-2xl font-semibold text-white/90">{totalDisponible}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
          ❌ {String(error)}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="min-w-full text-sm text-gray-200">
          <thead className="bg-white/5 text-gray-400">
            <tr className="text-left">
              <th className="px-4 py-2">Bodega</th>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2 text-right">Existencia</th>
              <th className="px-4 py-2 text-right">Disponible</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">Cargando…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No hay registros para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              rows.map((r: any, i: number) => (
                <tr key={`${r.bodega}-${r.sku}-${i}`} className="border-t border-gray-800 hover:bg-white/5">
                  <td className="px-4 py-2">{r.bodega}</td>
                  <td className="px-4 py-2">{r.producto}</td>
                  <td className="px-4 py-2">{r.sku}</td>
                  <td className="px-4 py-2 text-right">{r.existencia}</td>
                  <td className="px-4 py-2 text-right">{r.disponible}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
