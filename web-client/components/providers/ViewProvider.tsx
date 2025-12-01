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
  <div className="flex flex-col gap-1">
    <span className="text-xs text-[#8B9AA0] uppercase tracking-wide">
      {label}
    </span>
    <span className="text-sm text-white">{value && value.trim() ? value : "—"}</span>
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
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#111518] text-[#E6E9EA] shadow-[0_30px_80px_rgba(0,0,0,.65)] ring-1 ring-black/30">
  
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-[#8B9AA0]">
              Proveedores
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-wide">
              Detalle de proveedor
            </h2>
            <p className="mt-1 text-sm text-[#8B9AA0]">
              Visualiza los datos importantes del proveedor.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#8B9AA0] hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mx-6 my-4 h-px bg-white/10" />

        <div className="px-6 pb-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#8B9AA0]">CÓDIGO</div>
              <div className="text-lg font-semibold text-white">{id}</div>
            </div>

            <PillBadge variant={isActive ? "success" : "danger"}>
              {isActive ? "Activo" : "Inactivo"}
            </PillBadge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ItemRow label="NOMBRE" value={nombre} />
            <ItemRow label="CONTACTO" value={contacto} />
            <ItemRow label="TELÉFONO" value={telefono} />
            <ItemRow label="CORREO" value={correo} />
            <div className="md:col-span-2">
              <ItemRow label="DIRECCIÓN" value={direccion} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ViewProvider;
