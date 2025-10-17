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

  const { getCantidad, loading: loadingCantidad, error: errCant } =
    useInventarioCantidad();
  const { setCantidad, loading: saving, error: errSave } =
    useInventarioSetCantidad();

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (open && typeof bodegaID === "number") {
        const cant = await getCantidad(productoID, bodegaID);
        if (!cancelled && cant !== null) {
          setCantidadActual(cant);
          setNuevaCantidad(String(cant));
        }
      } else {
        setCantidadActual(null);
        setNuevaCantidad("0");
      }
    };
    load().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, bodegaID, productoID, getCantidad]);

  const onGuardar = async () => {
    if (!open) return;
    if (typeof bodegaID !== "number") {
      alert("Selecciona una bodega.");
      return;
    }
    const val = Number(nuevaCantidad);
    if (Number.isNaN(val) || val < 0) {
      alert("Ingresa una cantidad válida (0 o mayor).");
      return;
    }

    const payload: InventarioSetCantidadDto = {
      productoID,
      bodegaID,
      nuevaCantidad: val,
      motivo: motivo?.trim() || null,
    };

    const ok = await setCantidad(payload);
    if (ok) {
      onSaved?.();
      onClose();
    } else {
      alert(errSave ?? "No se pudo guardar la cantidad.");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121618] p-5">
        <h3 className="mb-3 text-lg font-semibold text-white">Editar cantidad</h3>

        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Bodega*</span>
            <select
              className="rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
              value={bodegaID}
              onChange={(e) =>
                setBodegaID(e.target.value === "" ? "" : Number(e.target.value))
              }
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
            <p className="text-xs text-white/60">
              {loadingCantidad
                ? "Cargando stock actual…"
                : errCant
                ? "No se pudo cargar el stock actual."
                : `Stock actual en esta bodega: ${cantidadActual ?? 0}`}
            </p>
          )}

          <label className="grid gap-1 text-sm">
            <span>Nueva cantidad*</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={nuevaCantidad}
              onChange={(e) => setNuevaCantidad(e.target.value)}
              className="rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
            />
            <span className="text-xs text-white/50">
              Esta acción fija la cantidad exacta (no es suma/resta).
            </span>
          </label>

          <label className="grid gap-1 text-sm">
            <span>Motivo</span>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
              placeholder="Opcional"
            />
          </label>

          {errSave && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errSave}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-white"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            disabled={saving || typeof bodegaID !== "number"}
            className="rounded-md bg-[#A30862] px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
