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

  const { data: unidadesRaw, loading: loadingUnits, error: unidadesError } =
    useUnidades();
  const { data: bodegasRaw, loading: loadingBodegas, error: bodegasError } =
    useBodegas();

  const unidades = useMemo(() => unidadesRaw ?? [], [unidadesRaw]);
  const bodegas = useMemo(() => bodegasRaw ?? [], [bodegasRaw]);

  const [showSuccess, setShowSuccess] = useState(false);

  const confirm = useConfirm();

  useEffect(() => {
    if (successId) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3500);
      return () => clearTimeout(t);
    }
  }, [successId]);

  const numOrNull = (v: string) => {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const formatMoneyOnBlur =
    (key: keyof typeof values) =>
    (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim();
      if (raw === "") return;
      const n = Number(raw);
      if (Number.isFinite(n)) {
        e.target.value = n.toFixed(2);
        setField(key, n);
      }
    };

  const showUnidadesError =
    !!unidadesError && !loadingUnits && unidades.length === 0;

  const showBodegasError =
    !!bodegasError && !loadingBodegas && bodegas.length === 0;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setShowSuccess(false);

    const ok = await confirm({
      title: "Confirmar registro",
      message: (
        <>
          ¿Deseas registrar este <b>producto</b> con la información ingresada?
        </>
      ),
      tone: "brand",
      confirmText: "Registrar",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    const result = await submit();
    if (!result.ok) {
      setShowSuccess(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">
      <header className="mb-5">
        <nav className="mb-3 flex flex-wrap items-center gap-y-1 text-sm text-[#8B9AA0]">
          <div className="flex items-center gap-1">
            <svg
              className="h-4 w-4 opacity-80"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M3 10.25 12 3l9 7.25V21a1 1 0 0 1-1 1h-5.5v-6.5h-5V22H4a1 1 0 0 1-1-1v-10.75Z" />
            </svg>
            <span>Inicio</span>
          </div>

          <span className="mx-2 text-[#4B5563]">/</span>

          <div className="flex items-center gap-1 text-white">
            <svg
              className="h-4 w-4 opacity-80"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M4 7a1 1 0 0 1 .7-.95l7-2.33a1 1 0 0 1 .6 0l7 2.33A1 1 0 0 1 20 7v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1ZM6 8.12V16h12V8.12l-6-2-6 2Z" />
            </svg>
            <span>Productos</span>
          </div>
        </nav>
      </header>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#151A1D_0%,#111417_100%)] p-5 shadow-[0_24px_70px_rgba(0,0,0,.38)] ring-1 ring-black/20 md:p-7">
        <div className="mb-6 flex flex-col gap-2 border-b border-white/6 pb-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#A30862]/12 px-3 py-1 text-[11px] font-medium tracking-wide text-[#F3D4E4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A30862]" />
            Registro de producto
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Nuevo producto
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[#97A6AC]">
            Completa la información principal del artículo. Los campos marcados
            con <span className="font-semibold text-[#F2C7DA]">*</span> son
            obligatorios.
          </p>
        </div>

        <div className="space-y-3">
          {showSuccess && successId && (
            <div
              role="status"
              className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200 shadow-sm"
            >
              <span>
                Producto <b className="text-white">#{successId}</b> registrado
                correctamente.
              </span>
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="rounded-md px-2 py-0.5 text-xs text-white/80 transition hover:bg-white/10"
                aria-label="Cerrar notificación"
              >
                Cerrar
              </button>
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 shadow-sm"
            >
              {serverError}
            </div>
          )}

          {showUnidadesError && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 shadow-sm"
            >
              Error al cargar unidades: {unidadesError}
            </div>
          )}

          {showBodegasError && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 shadow-sm"
            >
              Error al cargar bodegas: {bodegasError}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <LabeledInput
            label="SKU*"
            placeholder="SKU único"
            value={values.sku ?? ""}
            onChange={(e) => setField("sku", e.target.value)}
            error={errors.sku}
            className="rounded-2xl border border-white/10 bg-[#1B2124] text-[#E6E9EA] shadow-inner focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Nombre*"
            placeholder="Nombre del producto"
            value={values.nombre ?? ""}
            onChange={(e) => setField("nombre", e.target.value)}
            error={errors.nombre}
            className="rounded-2xl border border-white/10 bg-[#1B2124] text-[#E6E9EA] shadow-inner focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Código interno"
            placeholder="Opcional"
            value={values.codigoInterno ?? ""}
            onChange={(e) => setField("codigoInterno", e.target.value)}
            className="rounded-2xl border border-white/10 bg-[#1B2124] text-[#E6E9EA] shadow-inner focus:ring-2 focus:ring-[#A30862]/40"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-wide text-[#9AABB1]">
              Unidad de almacenamiento*
            </label>
            <div className="relative">
              <select
                className="select-dark w-full pr-8"
                value={values.unidadAlmacenamientoID ?? ""}
                onChange={(e) =>
                  setField(
                    "unidadAlmacenamientoID",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                disabled={loadingUnits}
                aria-invalid={!!errors.unidadAlmacenamientoID}
              >
                <option value="">
                  {loadingUnits ? "Cargando..." : "Selecciona una unidad"}
                </option>
                {unidades.map((u) => (
                  <option key={u.unidadID} value={u.unidadID}>
                    {u.nombre} {u.codigo ? `(${u.codigo})` : ""}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#6B7280] text-xs">
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" />
                </svg>
              </span>
            </div>
            {errors.unidadAlmacenamientoID ? (
              <span className="text-xs text-rose-300">
                {errors.unidadAlmacenamientoID}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-wide text-[#9AABB1]">
              Bodega (opcional)
            </label>
            <div className="relative">
              <select
                className="select-dark w-full pr-8"
                value={values.bodegaID ?? ""}
                onChange={(e) =>
                  setField(
                    "bodegaID",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                disabled={loadingBodegas}
                aria-invalid={!!errors.bodegaID}
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
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#6B7280] text-xs">
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" />
                </svg>
              </span>
            </div>
            {errors.bodegaID ? (
              <span className="text-xs text-rose-300">{errors.bodegaID}</span>
            ) : null}
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
            className="rounded-2xl border border-white/10 bg-[#1B2124] text-[#E6E9EA] shadow-inner focus:ring-2 focus:ring-[#A30862]/40"
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
            className="rounded-2xl border border-white/10 bg-[#1B2124] text-[#E6E9EA] shadow-inner focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Descuento (%)"
            type="number"
            step="0.01"
            placeholder="0"
            value={values.descuento ?? ""}
            onChange={(e) => setField("descuento", numOrNull(e.target.value))}
            error={errors.descuento}
            className="rounded-2xl border border-white/10 bg-[#1B2124] text-[#E6E9EA] shadow-inner focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Peso (kg)"
            type="number"
            step="0.01"
            value={values.peso ?? ""}
            onChange={(e) => setField("peso", numOrNull(e.target.value))}
            error={errors.peso}
            className="rounded-2xl border border-white/10 bg-[#1B2124] text-[#E6E9EA] shadow-inner focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Largo (cm)"
            type="number"
            step="0.01"
            value={values.largo ?? ""}
            onChange={(e) => setField("largo", numOrNull(e.target.value))}
            error={errors.largo}
            className="rounded-2xl border border-white/10 bg-[#1B2124] text-[#E6E9EA] shadow-inner focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Alto (cm)"
            type="number"
            step="0.01"
            value={values.alto ?? ""}
            onChange={(e) => setField("alto", numOrNull(e.target.value))}
            error={errors.alto}
            className="rounded-2xl border border-white/10 bg-[#1B2124] text-[#E6E9EA] shadow-inner focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Ancho (cm)"
            type="number"
            step="0.01"
            value={values.ancho ?? ""}
            onChange={(e) => setField("ancho", numOrNull(e.target.value))}
            error={errors.ancho}
            className="rounded-2xl border border-white/10 bg-[#1B2124] text-[#E6E9EA] shadow-inner focus:ring-2 focus:ring-[#A30862]/40"
          />
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <label className="text-xs font-medium tracking-wide text-[#9AABB1]">
            Descripción
          </label>
          <textarea
            placeholder="Opcional"
            value={values.descripcion ?? ""}
            onChange={(e) => setField("descripcion", e.target.value)}
            className="min-h-[120px] rounded-2xl border border-white/10 bg-[#1B2124] px-4 py-3 text-sm text-[#E6E9EA] shadow-inner placeholder:text-[#8B9AA0] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
          />
        </div>

        <div className="mt-7 flex items-center justify-end border-t border-white/6 pt-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-[#A30862] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(163,8,98,.25)] transition hover:translate-y-[-1px] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#A30862]/40 disabled:translate-y-0 disabled:opacity-60"
          >
            {loading ? "Registrando…" : "Registrar producto"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .select-dark {
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: #1b2124;
          color: #e5e7eb;
          min-height: 44px;
          padding: 0.65rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          appearance: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.03);
          transition: box-shadow 0.2s, border-color 0.2s, background-color 0.2s;
        }

        .select-dark:focus {
          border-color: rgba(163, 8, 98, 0.8);
          box-shadow: 0 0 0 2px rgba(163, 8, 98, 0.45);
          background-color: #182025;
        }

        .select-dark:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .select-dark option {
          background-color: #101518;
          color: #e5e7eb;
        }

        .select-dark option[value=""] {
          color: #9ca3af;
        }

        .select-dark option:disabled {
          color: #6b7280;
        }

        .select-dark::-ms-expand {
          display: none;
        }
      `}</style>
    </div>
  );
}