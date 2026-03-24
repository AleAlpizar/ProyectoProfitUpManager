"use client";

import * as React from "react";
import { useInventarioCantidad } from "@/components/hooks/useInventarioCantidad";
import {
  useInventarioSetCantidad,
  type InventarioSetCantidadDto,
} from "@/components/hooks/useInventarioSetCantidad";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  productoID: number;
  productoNombre?: string;
  bodegas: { bodegaID: number; nombre: string; codigo?: string | null }[];
  initialBodegaID?: number | null;
};

export default function EditarCantidadModal({
  open,
  onClose,
  productoID,
  productoNombre,
  bodegas,
  initialBodegaID = null,
  onSaved,
}: Props) {
  const [bodegaID, setBodegaID] = React.useState<number | "">(
    initialBodegaID ?? ""
  );
  const [cantidadActual, setCantidadActual] = React.useState<number | null>(null);
  const [nuevaCantidad, setNuevaCantidad] = React.useState<string>("0");
  const [motivo, setMotivo] = React.useState<string>("Ajuste manual (auditoría)");
  const [formError, setFormError] = React.useState<string | null>(null);

  const { getCantidad, loading: loadingCantidad, error: errCant } =
    useInventarioCantidad();
  const { setCantidad, loading: saving, error: errSave } =
    useInventarioSetCantidad();

  React.useEffect(() => {
    if (!open) return;

    setBodegaID(initialBodegaID ?? "");
    setCantidadActual(null);
    setNuevaCantidad("0");
    setMotivo("Ajuste manual (auditoría)");
    setFormError(null);
  }, [open, initialBodegaID, productoID]);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, saving]);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!open || typeof bodegaID !== "number") {
        setCantidadActual(null);
        setNuevaCantidad("0");
        return;
      }

      const cant = await getCantidad(productoID, bodegaID);

      if (cancelled) return;

      if (cant !== null) {
        setCantidadActual(cant);
        setNuevaCantidad(String(cant));
      } else {
        setCantidadActual(null);
      }
    };

    load().catch(() => {
      if (!cancelled) {
        setCantidadActual(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, bodegaID, productoID, getCantidad]);

  const handleClose = React.useCallback(() => {
    if (saving) return;
    setFormError(null);
    onClose();
  }, [onClose, saving]);

  const validate = React.useCallback((): string | null => {
    if (!open) return "El modal no está disponible.";
    if (!Number.isInteger(productoID) || productoID <= 0) {
      return "El producto seleccionado no es válido.";
    }
    if (typeof bodegaID !== "number" || !Number.isInteger(bodegaID) || bodegaID <= 0) {
      return "Selecciona una bodega válida.";
    }

    const val = Number(nuevaCantidad);

    if (nuevaCantidad.trim() === "") {
      return "Debes ingresar una cantidad.";
    }
    if (!Number.isFinite(val) || Number.isNaN(val)) {
      return "Ingresa una cantidad válida.";
    }
    if (val < 0) {
      return "La cantidad no puede ser negativa.";
    }

    return null;
  }, [open, productoID, bodegaID, nuevaCantidad]);

  const onGuardar = async () => {
    const validationError = validate();
    setFormError(validationError);

    if (validationError) return;

    const payload: InventarioSetCantidadDto = {
      productoID,
      bodegaID: Number(bodegaID),
      nuevaCantidad: Number(nuevaCantidad),
      motivo: motivo.trim() ? motivo.trim() : null,
    };

    const ok = await setCantidad(payload);

    if (!ok) {
      setFormError(errSave ?? "No se pudo guardar la cantidad.");
      return;
    }

    await Promise.resolve(onSaved?.());
    handleClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-[3px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="editar-cantidad-modal-title"
    >
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#121618] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.48)]">
        <div className="mb-5 border-b border-white/10 pb-4">
          <h3
            id="editar-cantidad-modal-title"
            className="text-xl font-semibold text-white"
          >
            Editar cantidad
          </h3>
          {productoNombre && (
            <p className="mt-2 text-sm text-white/60">
              Producto: <span className="font-medium text-white">{productoNombre}</span>
            </p>
          )}
        </div>

        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-white/90">Bodega*</span>
            <select
              className="rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2.5 text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40 disabled:cursor-not-allowed disabled:opacity-60"
              value={bodegaID}
              onChange={(e) => {
                setFormError(null);
                setBodegaID(
                  e.target.value === "" ? "" : Number(e.target.value)
                );
              }}
              disabled={saving}
              aria-invalid={!!formError && typeof bodegaID !== "number"}
            >
              <option value="">Selecciona una bodega</option>
              {bodegas.map((b) => (
                <option key={b.bodegaID} value={b.bodegaID}>
                  {b.nombre} {b.codigo ? `(${b.codigo})` : ""}
                </option>
              ))}
            </select>
          </label>

          {typeof bodegaID === "number" && (
            <div
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white/70"
              aria-live="polite"
            >
              {loadingCantidad
                ? "Cargando stock actual…"
                : errCant
                ? "No se pudo cargar el stock actual."
                : `Stock actual en esta bodega: ${cantidadActual ?? 0}`}
            </div>
          )}

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-white/90">Nueva cantidad*</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={nuevaCantidad}
              onChange={(e) => {
                setFormError(null);
                setNuevaCantidad(e.target.value);
              }}
              className="rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2.5 text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
              aria-invalid={!!formError}
            />
            <span className="text-xs leading-5 text-white/50">
              Esta acción fija la cantidad exacta. No suma ni resta sobre el stock actual.
            </span>
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-white/90">Motivo</span>
            <input
              value={motivo}
              onChange={(e) => {
                setFormError(null);
                setMotivo(e.target.value);
              }}
              className="rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2.5 text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
              placeholder="Opcional"
              maxLength={250}
            />
          </label>

          {(formError || errSave) && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
              {formError || errSave}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onGuardar}
            disabled={saving || typeof bodegaID !== "number"}
            className="rounded-xl bg-[#A30862] px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}