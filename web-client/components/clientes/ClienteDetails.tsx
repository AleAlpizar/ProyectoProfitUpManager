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

export default function ClienteDetails({
  cliente,
  onClose,
}: {
  cliente: Cliente;
  onClose: () => void;
}) {
  const estado = cliente.isActive ? "Activo" : "Inactivo";

  return (
    <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#13171A] text-[#E6E9EA] shadow-[0_30px_80px_rgba(0,0,0,.55)] ring-1 ring-black/20">
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-[#8B9AA0]">
            Detalle de cliente
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-wide">{cliente.nombre}</h2>
          <p className="mt-1 text-sm text-[#8B9AA0]">
            Visualiza los datos importantes del cliente.
          </p>
        </div>

        <Button
          variant="outline"
          type="button"
          onClick={onClose}
          className="!rounded-xl !border-white/20 !bg-transparent !text-[#E6E9EA] hover:!bg-white/5 focus:!ring-2 focus:!ring-[#A30862]/40"
        >
          Cerrar
        </Button>
      </div>

      <div className="mx-6 my-4 h-px bg-white/10" />

      <div className="px-6 pb-6">
        <table className="w-full border-separate border-spacing-y-2 text-sm">
          <tbody>
            <tr>
              <td className="w-1/3 align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Código
              </td>
              <td className="align-top text-sm">{safe(cliente.codigoCliente ?? undefined)}</td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Nombre
              </td>
              <td className="align-top text-sm">{cliente.nombre}</td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Tipo de persona
              </td>
              <td className="align-top text-sm">{safe(cliente.tipoPersona)}</td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Identificación
              </td>
              <td className="align-top text-sm">{safe(cliente.identificacion)}</td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Correo
              </td>
              <td className="align-top text-sm">{safe(cliente.correo)}</td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Teléfono
              </td>
              <td className="align-top text-sm">{safe(cliente.telefono)}</td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Dirección
              </td>
              <td className="align-top text-sm">{safe(cliente.direccion)}</td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Estado
              </td>
              <td className="align-top text-sm">
                <PillBadge variant={cliente.isActive ? "success" : "danger"}>
                  {estado}
                </PillBadge>
              </td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Fecha de registro
              </td>
              <td className="align-top text-sm">
                {formatDateTime(cliente.fechaRegistro ?? cliente.createdAt)}
              </td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Descuento actual
              </td>
              <td className="align-top text-sm">
                <span className="font-medium">
                  {Math.round(cliente.descuentoPorcentaje ?? 0)}%
                </span>
              </td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Notas / Motivo
              </td>
              <td className="align-top text-sm">
                {safe(cliente.descuentoDescripcion)}
              </td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Creado
              </td>
              <td className="align-top text-sm">{formatDateTime(cliente.createdAt)}</td>
            </tr>
            <tr>
              <td className="align-top text-xs font-semibold uppercase tracking-wide text-[#8B9AA0]">
                Última actualización
              </td>
              <td className="align-top text-sm">{formatDateTime(cliente.updatedAt)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
