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
  const [formError, setFormError] = React.useState<string | null>(null);

  const isSubmitDisabled =
    loading || loadingB || loadingP || productoID === "" || bodegaID === "";

  const clearMessages = React.useCallback(() => {
    setOkMsg(null);
    setFormError(null);
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOkMsg(null);
    setFormError(null);

    if (productoID === "" || bodegaID === "") {
      setFormError("Debe seleccionar un producto y una bodega.");
      return;
    }

    if (
      !Number.isInteger(Number(productoID)) ||
      !Number.isInteger(Number(bodegaID)) ||
      Number(productoID) <= 0 ||
      Number(bodegaID) <= 0
    ) {
      setFormError("Los valores seleccionados no son válidos.");
      return;
    }

    const r = await asignar({
      productoID: Number(productoID),
      bodegaID: Number(bodegaID),
    });

    if (r.ok) {
      setOkMsg("Producto asignado correctamente.");
    } else {
      setFormError("No se pudo asignar el producto a la bodega.");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 rounded-2xl border border-white/10 bg-[#121618]/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,.25)]"
      noValidate
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-wide text-white">
            Asignar producto a bodega
          </h3>
          <p className="mt-1 text-xs text-white/55">
            Selecciona un producto y la bodega donde quedará asociado.
          </p>
        </div>
      </div>

      {(formError || error) && (
        <div
          className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2.5 text-sm text-red-200"
          aria-live="polite"
        >
          {formError || error}
        </div>
      )}

      {okMsg && (
        <div
          className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2.5 text-sm text-emerald-200"
          aria-live="polite"
        >
          {okMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-white/90">
          <span className="font-medium">Producto*</span>
          <select
            value={productoID}
            onChange={(e) => {
              clearMessages();
              setProductoID(
                e.target.value === "" ? "" : Number(e.target.value)
              );
            }}
            className="rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2.5 text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/35 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loadingP || loading}
            aria-invalid={!!formError && productoID === ""}
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

        <label className="grid gap-1.5 text-sm text-white/90">
          <span className="font-medium">Bodega*</span>
          <select
            value={bodegaID}
            onChange={(e) => {
              clearMessages();
              setBodegaID(e.target.value === "" ? "" : Number(e.target.value));
            }}
            className="rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2.5 text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/35 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loadingB || loading}
            aria-invalid={!!formError && bodegaID === ""}
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

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="rounded-xl bg-[#A30862] px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Asignando…" : "Asignar"}
        </button>
      </div>
    </form>
  );
}