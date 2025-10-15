"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useProductoCreate } from "@/components/hooks/useProductoCreate";
import { useUnidades } from "@/components/hooks/useUnidades";
import { useBodegas } from "@/components/hooks/useBodegas";
import LabeledInput from "../Inputs/LabeledInput";

export default function ProductoCreateForm() {
  const {
    values,
    setField,
    errors,
    loading,
    canSubmit,
    submit,
    serverError,
    successId,
  } = useProductoCreate();

  const { data: unidadesRaw, loading: loadingUnits, error: unidadesError } = useUnidades();
  const { data: bodegasRaw, loading: loadingBodegas, error: bodegasError } = useBodegas();

  const unidades = useMemo(() => unidadesRaw ?? [], [unidadesRaw]);
  const bodegas  = useMemo(() => bodegasRaw  ?? [], [bodegasRaw]);

  const [bodegaID, setBodegaID] = useState<number | "">("");

  useEffect(() => {
    if (successId) alert(`Producto registrado correctamente. ID #${successId}`);
  }, [successId]);

  const numOrNull = (v: string) => (v === "" ? null : Number(v));

  const formatMoneyOnBlur =
    (key: keyof typeof values) =>
    (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim();
      if (raw === "") return;
      const n = Number(raw);
      if (!Number.isNaN(n)) {
        e.target.value = n.toFixed(2);
        setField(key, n);
      }
    };

  return (
    <div className="space-y-4">
      {successId && (
        <div role="alert" className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-300">
          ✅ Producto registrado con ID <b>{successId}</b>.
        </div>
      )}
      {serverError && (
        <div role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
           {serverError}
        </div>
      )}
      {unidadesError && (
        <div role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
           Error al cargar unidades: {unidadesError}
        </div>
      )}
      {bodegasError && (
        <div role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
           Error al cargar bodegas: {bodegasError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LabeledInput
          label="SKU*"
          placeholder="SKU único"
          value={values.sku ?? ""}
          onChange={(e) => setField("sku", e.target.value)}
          error={errors.sku}
          className="rounded-xl border border-white/10 bg-white/5 text-gray-100 focus:ring-2"
        />

        <LabeledInput
          label="Nombre*"
          placeholder="Nombre del producto"
          value={values.nombre ?? ""}
          onChange={(e) => setField("nombre", e.target.value)}
          error={errors.nombre}
          className="rounded-xl border border-white/10 bg-white/5 text-gray-100 focus:ring-2"
        />

        <LabeledInput
          label="Código interno"
          placeholder="Opcional"
          value={values.codigoInterno ?? ""}
          onChange={(e) => setField("codigoInterno", e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 text-gray-100 focus:ring-2"
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Unidad de almacenamiento*</label>
          <select
            value={values.unidadAlmacenamientoID ?? ""}
            onChange={(e) =>
              setField(
                "unidadAlmacenamientoID",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            disabled={loadingUnits}
            aria-invalid={!!errors.unidadAlmacenamientoID}
            className={[
              "rounded-xl px-3 py-2 text-sm outline-none transition",
              "bg-white/5 text-gray-100",
              "border border-white/10 focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40",
              errors.unidadAlmacenamientoID ? "border-red-400" : "",
            ].join(" ")}
          >
            <option value="">{loadingUnits ? "Cargando..." : "Selecciona una unidad"}</option>
            {unidades.map((u) => (
              <option key={u.unidadID} value={u.unidadID}>
                {u.nombre} {u.codigo ? `(${u.codigo})` : ""}
              </option>
            ))}
          </select>
          {errors.unidadAlmacenamientoID ? (
            <span className="text-xs text-red-400">{errors.unidadAlmacenamientoID}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Bodega (opcional)</label>
          <select
            value={bodegaID}
            onChange={(e) => setBodegaID(e.target.value === "" ? "" : Number(e.target.value))}
            disabled={loadingBodegas}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
          >
            <option value="">{loadingBodegas ? "Cargando..." : "Selecciona una bodega"}</option>
            {bodegas.map((b) => (
              <option key={b.bodegaID} value={b.bodegaID}>
                {b.nombre} {b.codigo ? `(${b.codigo})` : ""}
              </option>
            ))}
          </select>
        </div>

        <LabeledInput
          label="Precio costo*"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={values.precioCosto ?? ""}
          onChange={(e) => setField("precioCosto", numOrNull(e.target.value))}
          onBlur={formatMoneyOnBlur("precioCosto")}
          error={errors.precioCosto}
          className="rounded-xl border border-white/10 bg-white/5 text-gray-100 focus:ring-2"
        />

        <LabeledInput
          label="Precio venta*"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={values.precioVenta ?? ""}
          onChange={(e) => setField("precioVenta", numOrNull(e.target.value))}
          onBlur={formatMoneyOnBlur("precioVenta")}
          error={errors.precioVenta}
          className="rounded-xl border border-white/10 bg-white/5 text-gray-100 focus:ring-2"
        />

        <LabeledInput
          label="Peso (kg)"
          type="number"
          step="0.01"
          value={values.peso ?? ""}
          onChange={(e) => setField("peso", numOrNull(e.target.value))}
          className="rounded-xl border border-white/10 bg-white/5 text-gray-100 focus:ring-2"
        />
        <LabeledInput
          label="Largo (cm)"
          type="number"
          step="0.01"
          value={values.largo ?? ""}
          onChange={(e) => setField("largo", numOrNull(e.target.value))}
          className="rounded-xl border border-white/10 bg-white/5 text-gray-100 focus:ring-2"
        />
        <LabeledInput
          label="Alto (cm)"
          type="number"
          step="0.01"
          value={values.alto ?? ""}
          onChange={(e) => setField("alto", numOrNull(e.target.value))}
          className="rounded-xl border border-white/10 bg-white/5 text-gray-100 focus:ring-2"
        />
        <LabeledInput
          label="Ancho (cm)"
          type="number"
          step="0.01"
          value={values.ancho ?? ""}
          onChange={(e) => setField("ancho", numOrNull(e.target.value))}
          className="rounded-xl border border-white/10 bg-white/5 text-gray-100 focus:ring-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-300">Descripción</label>
        <textarea
          placeholder="Opcional"
          value={values.descripcion ?? ""}
          onChange={(e) => setField("descripcion", e.target.value)}
          className="min-h-[90px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className="inline-flex items-center justify-center rounded-xl bg-[#A30862] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Registrando…" : "Registrar producto"}
        </button>
      </div>
    </div>
  );
}
