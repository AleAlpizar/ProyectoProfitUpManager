import React, { useMemo, useState } from "react";
import type { BodegaCreate } from "@/types/bodega";

type Props = {
  onSubmit: (payload: BodegaCreate) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
  onErrorClear?: () => void;
};

export default function BodegaForm({ onSubmit, submitting, error, onErrorClear }: Props) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [contacto, setContacto] = useState("");

  const canSubmit = useMemo(() => nombre.trim().length > 0 && !submitting, [nombre, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: BodegaCreate = {
      nombre: nombre.trim(),
      codigo: codigo.trim() || undefined,
      direccion: direccion.trim() || undefined,
      contacto: contacto.trim() || undefined,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={onErrorClear} className="ml-3 underline">cerrar</button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Código (opcional)</label>
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="BG-01"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre *</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          placeholder="Central"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Ubicación</label>
        <input
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="San José"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Contacto</label>
        <input
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          placeholder="persona@empresa.com / 8888-8888"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white shadow hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
