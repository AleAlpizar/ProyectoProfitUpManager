import React, { useState } from "react";
import { useBodegas } from "@hooks/useBodegas";
import Modal from "@/components/Modal";
import BodegaForm from "@/components/BodegaForm";
import BodegaCard from "@/components/BodegaCard";

export default function BodegasPage() {
  const {
    items, initialLoading, error, setError,
    create, creating, createError, setCreateError,
    toggleActive, updating, toggling,
  } = useBodegas();

  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight">Bodegas</h1>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white shadow hover:bg-green-700 focus:outline-none"
        >
          <span className="mr-2 text-xl">+</span> Nueva bodega
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline">cerrar</button>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-semibold text-gray-500">Listado</h2>

        {initialLoading ? (
          <div className="rounded-xl border border-gray-200 p-6 text-gray-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-6 text-gray-500">
            Aún no hay bodegas. Crea la primera con el botón “Nueva bodega”.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => (
              <BodegaCard
                key={b.bodegaId}
                data={b}
                onToggle={(id, next) => toggleActive(id, next)}
                onEdit={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Crear bodega">
        <BodegaForm
          submitting={creating}
          error={createError}
          onErrorClear={() => setCreateError(null)}
          onSubmit={async (payload) => {
            await create(payload);
            setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
