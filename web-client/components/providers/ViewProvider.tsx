"use client";

import React from "react";
import Modal from "../modals/Modal";
import { PillBadge } from "../ui/table";

export type ProviderViewModel = {
  id: string;
  proveedorId: number;
  nombre: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  isActive: boolean;
};

type Props = {
  provider: ProviderViewModel;
  onClose: () => void;
};

const ItemRow: React.FC<{ label: string; value?: string }> = ({
  label,
  value,
}) => (
  <div className="rounded-2xl border border-white/10 bg-[#151A1D] px-4 py-3.5">
    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8B9AA0]">
      {label}
    </div>
    <div className="mt-1.5 break-words text-sm leading-6 text-white">
      {value && value.trim() ? value : "—"}
    </div>
  </div>
);

const ViewProvider: React.FC<Props> = ({ provider, onClose }) => {
  const {
    id,
    nombre,
    contacto,
    telefono,
    correo,
    direccion,
    isActive,
  } = provider;

  return (
    <Modal frameless onClose={onClose}>
      <div className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#111518] text-[#E6E9EA] shadow-[0_30px_80px_rgba(0,0,0,.65)] ring-1 ring-black/30">
        <div className="flex items-start justify-between gap-4 px-7 pt-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#9AA8AE]">
              Proveedores
            </div>
            <h2 className="mt-3 text-[22px] font-semibold tracking-[0.01em] text-white">
              Detalle de proveedor
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#8B9AA0]">
              Visualiza la información general y de contacto del proveedor seleccionado.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-[#8B9AA0] transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mx-7 my-5 h-px bg-white/10" />

        <div className="px-7 pb-7">
          <div className="mb-5 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#151A1D] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8B9AA0]">
                Código
              </div>
              <div className="mt-1 text-xl font-semibold text-white">{id}</div>
            </div>

            <PillBadge variant={isActive ? "success" : "danger"}>
              {isActive ? "Activo" : "Inactivo"}
            </PillBadge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ItemRow label="Nombre" value={nombre} />
            <ItemRow label="Contacto" value={contacto} />
            <ItemRow label="Teléfono" value={telefono} />
            <ItemRow label="Correo" value={correo} />
            <div className="md:col-span-2">
              <ItemRow label="Dirección" value={direccion} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ViewProvider;