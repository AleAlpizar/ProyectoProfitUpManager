"use client";

import React, { useEffect, useState } from "react";
import { useProductoCreate } from "@/components/hooks/useProductoCreate";
import { useUnidades } from "@/components/hooks/useUnidades";
import { useBodegas } from "@/components/hooks/useBodegas"; 

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

function LabeledInput({ label, error, ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-300">{label}</label>
      <input
        {...rest}
        className={`rounded-xl border bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 outline-none transition
        ${error ? "border-red-400" : "border-gray-700 focus:border-gray-500"}`}
      />
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </div>
  );
}

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

  const {
    data: unidades,
    loading: loadingUnits,
    error: unidadesError,
  } = useUnidades();

  const {
    data: bodegas,
    loading: loadingBodegas,
    error: bodegasError,
  } = useBodegas();
  const [bodegaID, setBodegaID] = useState<number | "">(""); 

  useEffect(() => {
    if (successId) {
      alert(`Producto registrado correctamente. ID #${successId}`);
    }
  }, [successId]);

  return (
    <div className="space-y-4">
      {successId && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-300">
          ✅ Producto registrado con ID <b>{successId}</b>.
        </div>
      )}

      {serverError && (
        <div className="rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
          ❌ {serverError}
        </div>
      )}

      {unidadesError && (
        <div className="rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
          ❌ Error al cargar unidades: {unidadesError}
        </div>
      )}

      {bodegasError && (
        <div className="rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
          ❌ Error al cargar bodegas: {bodegasError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LabeledInput
          label="SKU*"
          placeholder="SKU único"
          value={values.sku}
          onChange={(e) => setField("sku", e.target.value)}
          error={errors.sku}
        />
        <LabeledInput
          label="Nombre*"
          placeholder="Nombre del producto"
          value={values.nombre}
          onChange={(e) => setField("nombre", e.target.value)}
          error={errors.nombre}
        />

        <LabeledInput
          label="Código interno"
          placeholder="Opcional"
          value={values.codigoInterno || ""}
          onChange={(e) => setField("codigoInterno", e.target.value)}
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
            className={`rounded-xl border bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none transition
              ${errors.unidadAlmacenamientoID ? "border-red-400" : "border-gray-700 focus:border-gray-500"}`}
            disabled={loadingUnits}
          >
            <option value="">
              {loadingUnits ? "Cargando..." : "Selecciona una unidad"}
            </option>
            {unidades.map((u) => (
              <option key={u.unidadID} value={u.unidadID}>
                {u.nombre} ({u.codigo})
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
            onChange={(e) =>
              setBodegaID(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="rounded-xl border border-gray-700 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-gray-500"
            disabled={loadingBodegas}
          >
            <option value="">
              {loadingBodegas ? "Cargando..." : "Selecciona una bodega"}
            </option>
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
          onChange={(e) =>
            setField("precioCosto", e.target.value === "" ? null : Number(e.target.value))
          }
          error={errors.precioCosto}
        />
        <LabeledInput
          label="Precio venta*"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={values.precioVenta ?? ""}
          onChange={(e) =>
            setField("precioVenta", e.target.value === "" ? null : Number(e.target.value))
          }
          error={errors.precioVenta}
        />

        <LabeledInput
          label="Peso (kg)"
          type="number"
          step="0.01"
          value={values.peso ?? ""}
          onChange={(e) =>
            setField("peso", e.target.value === "" ? null : Number(e.target.value))
          }
        />
        <LabeledInput
          label="Largo (cm)"
          type="number"
          step="0.01"
          value={values.largo ?? ""}
          onChange={(e) =>
            setField("largo", e.target.value === "" ? null : Number(e.target.value))
          }
        />
        <LabeledInput
          label="Alto (cm)"
          type="number"
          step="0.01"
          value={values.alto ?? ""}
          onChange={(e) =>
            setField("alto", e.target.value === "" ? null : Number(e.target.value))
          }
        />
        <LabeledInput
          label="Ancho (cm)"
          type="number"
          step="0.01"
          value={values.ancho ?? ""}
          onChange={(e) =>
            setField("ancho", e.target.value === "" ? null : Number(e.target.value))
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-300">Descripción</label>
        <textarea
          placeholder="Opcional"
          value={values.descripcion || ""}
          onChange={(e) => setField("descripcion", e.target.value)}
          className="min-h-[90px] rounded-xl border border-gray-700 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 outline-none transition focus:border-gray-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Registrando…" : "Registrar producto"}
        </button>
      </div>
    </div>
  );
}
