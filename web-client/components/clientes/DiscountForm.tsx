import React from "react";
import Field from "../Inputs/fields";
import { Cliente } from "./types";
import Button from "../buttons/button";

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

const DiscountForm = ({
  cliente,
  onCancel,
  onSave,
}: {
  cliente: Cliente;
  onCancel: () => void;
  onSave: (value: number) => void;
}) => {
  const original = typeof cliente.descuento === "number" ? clamp(cliente.descuento) : 0;

  const [value, setValue] = React.useState<number>(original);
  const [notes, setNotes] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const setValueSafe = (raw: number | string) => {
    const n = typeof raw === "string" ? parseFloat(raw) : raw;
    if (Number.isNaN(n)) return setValue(0);
    setValue(clamp(n));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.isNaN(value) || value < 0 || value > 100) {
      return setError("El descuento debe estar entre 0% y 100%.");
    }
    onSave(Math.round(value));
  };

  const hasChanged = Math.round(value) !== Math.round(original) || notes.trim().length > 0;

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#121618] text-[#E6E9EA] shadow-[0_30px_80px_rgba(0,0,0,.55)] ring-1 ring-black/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-[#8B9AA0]">
            Descuentos
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-wide">Administrar descuento</h2>
          <p className="mt-1 text-sm text-[#8B9AA0]">
            Cliente: <span className="text-white font-medium">{cliente.nombre}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setValue(original); setNotes(""); setError(null); }}
            className="!rounded-xl !border-white/20 !bg-transparent !text-[#E6E9EA] hover:!bg-white/5 focus:!ring-2 focus:!ring-[#A30862]/40"
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="!rounded-xl !border-white/20 !bg-transparent !text-[#E6E9EA] hover:!bg-white/5 focus:!ring-2 focus:!ring-[#A30862]/40"
          >
            Cerrar
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 my-4 h-px bg-white/10" />

      {/* Error */}
      {error && (
        <div className="mx-6 mb-4 rounded-2xl border border-[#6C0F1C]/40 bg-[#6C0F1C]/15 px-4 py-3 text-sm text-[#F7C6CF]">
          {error}
        </div>
      )}

      {/* Campos */}
      <div className="grid grid-cols-1 gap-5 px-6 pb-2 sm:grid-cols-2">
        {/* Porcentaje */}
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs text-[#8B9AA0]">Porcentaje (%)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={value}
              onChange={(e) => setValueSafe(e.target.value)}
              className="w-full accent-[#A30862]"
            />
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={Number.isNaN(value) ? "" : value}
              onChange={(e) => setValueSafe(e.target.value)}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()} // evita scroll accidental
              className="w-20 rounded-2xl border border-white/10 bg-[#1C2224] px-2 py-2 text-sm outline-none
                         focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
            />
          </div>

          {/* Preview */}
          <div className="mt-1 flex items-center justify-between text-xs text-[#8B9AA0]">
            <span>Actual: <b className="text-white">{original}%</b></span>
            <span>Nuevo: <b className="text-white">{Math.round(value)}%</b></span>
          </div>
        </div>

        {/* Notas */}
        <Field label="Notas (opcional)">
          <input
            placeholder="Escribe aquí tus notas…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#1C2224] px-3 py-2 text-sm outline-none
                       placeholder:text-[#8B9AA0] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
          />
        </Field>

        {/* Indicador visual */}
        <div className="sm:col-span-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#95B64F]/25 bg-[#95B64F]/15 px-3 py-1 text-xs text-[#95B64F]">
            <span className="text-[10px]">●</span>
            Descuento aplicado: <b className="ml-1">{Math.round(value)}%</b>
            {notes.trim() && <span className="ml-2 text-[#8B9AA0]">({notes.trim()})</span>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mx-6 mt-4 mb-6 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="!rounded-2xl !border-white/20 !bg-transparent !text-[#E6E9EA] hover:!bg-white/5 focus:!ring-2 focus:!ring-[#A30862]/40"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          className="!rounded-2xl !bg-[#A30862] !text-white hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40 disabled:!opacity-60"
          disabled={!hasChanged}
        >
          Guardar descuento
        </Button>
      </div>
    </form>
  );
};

export default DiscountForm;
