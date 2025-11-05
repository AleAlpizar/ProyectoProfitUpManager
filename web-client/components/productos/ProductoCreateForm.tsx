"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useProductoCreate } from "../hooks/useProductoCreate";
import { useUnidades } from "../hooks/useUnidades";
import { useBodegas } from "../hooks/useBodegas";
import LabeledInput from "../Inputs/LabeledInput";
import { useConfirm } from "../modals/ConfirmProvider";

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
  const { data: bodegasRaw,  loading: loadingBodegas, error: bodegasError } = useBodegas();

  const unidades = useMemo(() => unidadesRaw ?? [], [unidadesRaw]);
  const bodegas  = useMemo(() => bodegasRaw  ?? [], [bodegasRaw]);

  const [bodegaID, setBodegaID] = useState<number | "">("");
  const [showSuccess, setShowSuccess] = useState(false);

  const confirm = useConfirm();

  useEffect(() => {
    if (successId) {
      setShowSuccess(true);
      // ocultar automático luego de unos segundos
      const t = setTimeout(() => setShowSuccess(false), 3500);
      return () => clearTimeout(t);
    }
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

  const showUnidadesError =
    !!unidadesError && !loadingUnits && unidades.length === 0;

  const showBodegasError =
    !!bodegasError && !loadingBodegas && bodegas.length === 0;

  // Confirmación con tu propio modal + envío
  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setShowSuccess(false);

    const ok = await confirm({
      title: "Confirmar registro",
      message: <>¿Deseas registrar este <b>producto</b> con la información ingresada?</>,
      tone: "brand",
      confirmText: "Registrar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    try {
      await submit();
      setShowSuccess(true);
    } catch {
      setShowSuccess(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl lg:max-w-[1200px] p-4 md:p-6">
      <div className="rounded-3xl border border-white/10 bg-[#13171A] p-5 shadow-[0_30px_80px_rgba(0,0,0,.35)] ring-1 ring-black/20">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#A30862]/10 px-2.5 py-1 text-[11px] text-[#E6E9EA]">
            Registro de producto
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">Nuevo producto</h2>
          <p className="text-sm text-[#8B9AA0]">Completa los campos obligatorios marcados con *</p>
        </div>

        <div className="space-y-3">
          {showSuccess && successId && (
            <div
              role="status"
              className="flex items-start justify-between gap-3 rounded-2xl border border-[#A30862]/40 bg-[#A30862]/10 px-4 py-3 text-sm text-[#F2C7DA]"
            >
              <span>✅ Producto <b className="text-white">#{successId}</b> se guardó correctamente.</span>
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="rounded-md px-2 py-0.5 text-xs text-white/80 hover:bg-white/10"
                aria-label="Cerrar notificación"
              >
                Cerrar
              </button>
            </div>
          )}
          {serverError && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
            >
              {serverError}
            </div>
          )}
          {showUnidadesError && (
            <div role="alert" className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              Error al cargar unidades: {unidadesError}
            </div>
          )}
          {showBodegasError && (
            <div role="alert" className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              Error al cargar bodegas: {bodegasError}
            </div>
          )}
        </div>

        {/* Form grid */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <LabeledInput
            label="SKU*"
            placeholder="SKU único"
            value={values.sku ?? ""}
            onChange={(e) => setField("sku", e.target.value)}
            error={errors.sku}
            className="rounded-2xl border border-white/10 bg-[#1C2224] text-[#E6E9EA] focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Nombre*"
            placeholder="Nombre del producto"
            value={values.nombre ?? ""}
            onChange={(e) => setField("nombre", e.target.value)}
            error={errors.nombre}
            className="rounded-2xl border border-white/10 bg-[#1C2224] text-[#E6E9EA] focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Código interno"
            placeholder="Opcional"
            value={values.codigoInterno ?? ""}
            onChange={(e) => setField("codigoInterno", e.target.value)}
            className="rounded-2xl border border-white/10 bg-[#1C2224] text-[#E6E9EA] focus:ring-2 focus:ring-[#A30862]/40"
          />

          {/* Unidad de almacenamiento */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8B9AA0]">Unidad de almacenamiento*</label>
            <select
              className="select-dark w-full"
              value={values.unidadAlmacenamientoID ?? ""}
              onChange={(e) =>
                setField("unidadAlmacenamientoID", e.target.value === "" ? null : Number(e.target.value))
              }
              disabled={loadingUnits}
              aria-invalid={!!errors.unidadAlmacenamientoID}
            >
              <option value="">{loadingUnits ? "Cargando..." : "Selecciona una unidad"}</option>
              {unidades.map((u) => (
                <option key={u.unidadID} value={u.unidadID}>
                  {u.nombre} {u.codigo ? `(${u.codigo})` : ""}
                </option>
              ))}
            </select>
            {errors.unidadAlmacenamientoID ? (
              <span className="text-xs text-rose-300">{errors.unidadAlmacenamientoID}</span>
            ) : null}
          </div>

          {/* Bodega */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8B9AA0]">Bodega (opcional)</label>
            <select
              className="select-dark w-full"
              value={bodegaID}
              onChange={(e) => setBodegaID(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={loadingBodegas}
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
            className="rounded-2xl border border-white/10 bg-[#1C2224] text-[#E6E9EA] focus:ring-2 focus:ring-[#A30862]/40"
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
            className="rounded-2xl border border-white/10 bg-[#1C2224] text-[#E6E9EA] focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Descuento (%)"
            type="number"
            step="0.01"
            placeholder="0"
            value={values.descuento ?? ""}
            onChange={(e) => setField("descuento", e.target.value === "" ? null : Number(e.target.value))}
            className="rounded-2xl border border-white/10 bg-[#1C2224] text-[#E6E9EA] focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Peso (kg)"
            type="number"
            step="0.01"
            value={values.peso ?? ""}
            onChange={(e) => setField("peso", numOrNull(e.target.value))}
            className="rounded-2xl border border-white/10 bg-[#1C2224] text-[#E6E9EA] focus:ring-2 focus:ring-[#A30862]/40"
          />
          <LabeledInput
            label="Largo (cm)"
            type="number"
            step="0.01"
            value={values.largo ?? ""}
            onChange={(e) => setField("largo", numOrNull(e.target.value))}
            className="rounded-2xl border border-white/10 bg-[#1C2224] text-[#E6E9EA] focus:ring-2 focus:ring-[#A30862]/40"
          />
          <LabeledInput
            label="Alto (cm)"
            type="number"
            step="0.01"
            value={values.alto ?? ""}
            onChange={(e) => setField("alto", numOrNull(e.target.value))}
            className="rounded-2xl border border-white/10 bg-[#1C2224] text-[#E6E9EA] focus:ring-2 focus:ring-[#A30862]/40"
          />
          <LabeledInput
            label="Ancho (cm)"
            type="number"
            step="0.01"
            value={values.ancho ?? ""}
            onChange={(e) => setField("ancho", numOrNull(e.target.value))}
            className="rounded-2xl border border-white/10 bg-[#1C2224] text-[#E6E9EA] focus:ring-2 focus:ring-[#A30862]/40"
          />
        </div>

        {/* Descripción */}
        <div className="mt-4 flex flex-col gap-1">
          <label className="text-xs text-[#8B9AA0]">Descripción</label>
          <textarea
            placeholder="Opcional"
            value={values.descripcion ?? ""}
            onChange={(e) => setField("descripcion", e.target.value)}
            className="min-h-[110px] rounded-2xl border border-white/10 bg-[#1C2224] px-3 py-2 text-sm text-[#E6E9EA] placeholder:text-[#8B9AA0] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="inline-flex items-center justify-center rounded-2xl bg-[#A30862] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40 disabled:opacity-60"
          >
            {loading ? "Registrando…" : "Registrar producto"}
          </button>
        </div>
      </div>

      {/* ====== ESTILOS PARA SELECT AQUÍ MISMO ====== */}
      <style jsx global>{`
        .select-dark {
          border-radius: 1rem;           /* rounded-2xl */
          border: 1px solid rgba(255,255,255,0.10);
          background-color: #1C2224;
          color: #E6E9EA;
          padding: 0.5rem 0.75rem;       /* px-3 py-2 */
          font-size: 0.875rem;           /* text-sm */
          outline: none;
          appearance: none;
          color-scheme: dark;
          transition: box-shadow .2s, border-color .2s, background-color .2s;
        }
        .select-dark:focus {
          border-color: rgba(163, 8, 98, 0.6);
          box-shadow: 0 0 0 2px rgba(163, 8, 98, 0.4);
        }
        .select-dark option,
        .select-dark optgroup {
          background-color: #1C2226;
          color: #E6E9EA;
        }
        .select-dark option:disabled {
          color: #8B9AA0;
        }
        .select-dark option:hover,
        .select-dark option:checked,
        .select-dark option:active {
          background-color: rgba(163, 8, 98, 0.28);
          color: #FFFFFF;
        }
        .select-dark::-ms-expand { display: none; }
      `}</style>
    </div>
  );
}
