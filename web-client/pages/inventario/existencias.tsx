import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import { useStock } from "../../components/hooks/useStock"; 

export default function ExistenciasPage() {
  const { rows, load, loading, error } = useStock();

  const [q, setQ] = useState("");
  const [fBodega, setFBodega] = useState<"Todas" | "Central" | "Norte" | "Sur">("Todas");

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const okQ = q.trim()
        ? (r.producto + " " + r.sku + " " + r.bodega).toLowerCase().includes(q.trim().toLowerCase())
        : true;
      const okB = fBodega === "Todas" ? true : r.bodega === fBodega;
      return okQ && okB;
    });
  }, [rows, q, fBodega]);

  return (
    <div className="p-6">
      <SectionHeader title="Existencias por bodega" />

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 mb-4">
        <input
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          placeholder="Producto / SKU / Bodega"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
        <h2 className="text-lg font-semibold mb-2">Resultados</h2>

        {/* errores */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 mb-3">
            {error.message}
          </div>
        )}

        {loading ? (
          <div className="text-neutral-500 px-3 py-6">Cargando…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600">
                  {["Bodega", "Producto", "SKU", "Existencia", "Disponible"].map((h, i) => (
                    <th key={i} className="px-3 py-2 font-semibold text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.sku + r.bodega} className="border-t border-neutral-200">
                    <td className="px-3 py-2">{r.bodega}</td>
                    <td className="px-3 py-2">{r.producto}</td>
                    <td className="px-3 py-2">{r.sku}</td>
                    <td className="px-3 py-2 font-semibold">{r.existencia}</td>
                    <td className="px-3 py-2">{r.disponible}</td>
                  </tr>
                ))}
                {filtered.length === 0 && !error && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-neutral-500">
                      Sin resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
