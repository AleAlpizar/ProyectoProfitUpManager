"use client";

import React from "react";
import Button from "../buttons/button";
import { Cliente } from "./types";
import { PillBadge } from "../ui/table";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const safe = (v?: string | null) => (v && v.trim() ? v : "—");

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/70 bg-white/[0.02] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B9AA0]">
        {label}
      </div>
      <div className="mt-2 text-sm text-[#E6E9EA]">{value}</div>
    </div>
  );
}

export default function ClienteDetails({
  cliente,
  onClose,
}: {
  cliente: Cliente;
  onClose: () => void;
}) {
  const estado = cliente.isActive ? "Activo" : "Inactivo";

  return (
    <div className="w-[min(100%,960px)] max-h-[92vh] overflow-y-auto rounded-2xl border border-black/70 bg-[#13171A] text-[#E6E9EA] shadow-[0_24px_70px_rgba(0,0,0,.55)] ring-1 ring-black/80">
      <div className="bg-gradient-to-r from-[#171C20] via-[#13171A] to-[#13171A] px-5 pt-5 pb-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/70 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#8B9AA0]">
              Detalle de cliente
            </div>
            <h2 className="mt-3 text-[clamp(1.35rem,2vw,1.9rem)] font-semibold tracking-[0.01em] text-white">
              {cliente.nombre}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[#8B9AA0]">
              Visualiza la información principal, estado y descuento del cliente.
            </p>
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            className="!rounded-xl !border-black/70 !bg-white/[0.03] !px-4 !py-2 !text-[#E6E9EA] hover:!bg-white/8 focus:!ring-2 focus:!ring-[#A30862]/40"
          >
            Cerrar
          </Button>
        </div>
      </div>

      <div className="h-px bg-black/70" />

      <div className="px-5 py-5 sm:px-6">
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-black/70 bg-[#171C20] px-4 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B9AA0]">
              Código
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {safe(cliente.codigoCliente ?? undefined)}
            </div>
          </div>

          <div className="rounded-xl border border-black/70 bg-[#171C20] px-4 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B9AA0]">
              Estado
            </div>
            <div className="mt-2">
              <PillBadge variant={cliente.isActive ? "success" : "danger"}>
                {estado}
              </PillBadge>
            </div>
          </div>

          <div className="rounded-xl border border-black/70 bg-[#16191D] px-4 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D9A3C4]">
              Descuento actual
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {Math.round(cliente.descuentoPorcentaje ?? 0)}%
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B9AA0]">
            Información del cliente
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DetailItem label="Nombre" value={cliente.nombre} />
          <DetailItem label="Tipo de persona" value={safe(cliente.tipoPersona)} />
          <DetailItem label="Identificación" value={safe(cliente.identificacion)} />
          <DetailItem label="Correo" value={safe(cliente.correo)} />
          <DetailItem label="Teléfono" value={safe(cliente.telefono)} />
          <DetailItem label="Fecha de registro" value={formatDateTime(cliente.fechaRegistro ?? cliente.createdAt)} />
          <div className="md:col-span-2">
            <DetailItem label="Dirección" value={safe(cliente.direccion)} />
          </div>
          <div className="md:col-span-2">
            <DetailItem label="Notas / Motivo" value={safe(cliente.descuentoDescripcion)} />
          </div>
        </div>

        <div className="mx-0 my-5 h-px bg-black/70" />

        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B9AA0]">
            Auditoría
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DetailItem label="Creado" value={formatDateTime(cliente.createdAt)} />
          <DetailItem label="Última actualización" value={formatDateTime(cliente.updatedAt)} />
        </div>
      </div>
    </div>
  );
}