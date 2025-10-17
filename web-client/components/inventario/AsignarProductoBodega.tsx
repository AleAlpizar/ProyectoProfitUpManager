"use client";

import React from "react";
import { useBodegas } from "../hooks/useBodegas";
import { useProductosMini } from "../hooks/useProductosMini";
import { useInventario } from "../hooks/useInventario";

export default function AsignarProductoBodega() {
  const { data: bodegas, loading: loadingB } = useBodegas();
  const { data: productos, loading: loadingP } = useProductosMini();
  const { asignar, loading, error } = useInventario();

  const [productoID, setProductoID] = React.useState<number | "">("");
  const [bodegaID, setBodegaID] = React.useState<number | "">("");
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOkMsg(null);

    if (productoID === "" || bodegaID === "") {
      alert("Debe seleccionar producto y bodega");
      return;
    }

    const r = await asignar({
      productoID: Number(productoID),
      bodegaID: Number(bodegaID),
    });

    if (r.ok) {
      setOkMsg("Producto asignado correctamente.");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
    >
      <h3 className="text-sm font-semibold text-white">
        Asignar producto a bodega
      </h3>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {okMsg && <p className="text-sm text-emerald-300">{okMsg}</p>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span>Producto*</span>
          <select
            value={productoID}
            onChange={(e) =>
              setProductoID(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
            disabled={loadingP}
          >
            <option value="">
              {loadingP ? "Cargando…" : "Selecciona un producto"}
            </option>
            {(productos ?? []).map((p) => (
              <option key={p.productoID} value={p.productoID}>
                {p.nombre} {p.sku ? `(${p.sku})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span>Bodega*</span>
          <select
            value={bodegaID}
            onChange={(e) =>
              setBodegaID(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
            disabled={loadingB}
          >
            <option value="">
              {loadingB ? "Cargando…" : "Selecciona una bodega"}
            </option>
            {(bodegas ?? []).map((b) => (
              <option key={b.bodegaID} value={b.bodegaID}>
                {b.nombre} {b.codigo ? `(${b.codigo})` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[#A30862] px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loading ? "Asignando…" : "Asignar"}
        </button>
      </div>
    </form>
  );
}
