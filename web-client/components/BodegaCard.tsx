import React from "react";
import type { Bodega } from "@/types/bodega";

type Props = {
  data: Bodega;
  onToggle?: (id: number, next: boolean) => void;
  onEdit?: (id: number) => void;
};

export default function BodegaCard({ data, onToggle, onEdit }: Props) {
  const { bodegaId, codigo, nombre, direccion, isActive } = data;

  return (
    <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="text-sm text-gray-500">Código</div>
      <div className="mb-2 text-xl font-bold">{codigo ?? "—"}</div>

      <div className="text-sm text-gray-500">Nombre</div>
      <div className="mb-2 text-lg font-semibold text-gray-700">{nombre}</div>

      <div className="text-sm text-gray-500">Ubicación</div>
      <div className="mb-4 text-gray-600">{direccion ?? "—"}</div>

      <span
        className={
          "inline-flex items-center rounded-full px-3 py-1 text-sm " +
          (isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")
        }
      >
        {isActive ? "Activa" : "Inactiva"}
      </span>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => onEdit?.(bodegaId)}
          className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800"
        >
          Editar
        </button>
        <button
          onClick={() => onToggle?.(bodegaId, !isActive)}
          className="rounded-lg border border-green-700 px-4 py-2 font-semibold text-green-700 hover:bg-green-50"
        >
          {isActive ? "Inactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}
