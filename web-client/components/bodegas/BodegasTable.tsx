"use client";

import React from "react";
import type { BodegaDto } from "@/components/hooks/useBodegas";

type Props = { rows: BodegaDto[] };

export default function BodegasTable({ rows }: Props) {
  const isEmpty = !rows || rows.length === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121618] text-[#E6E9EA] shadow-[0_10px_30px_rgba(0,0,0,.25)]">
      {/* Header de la tabla */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1C2224]">
        <h3 className="text-sm font-semibold tracking-wide">Bodegas</h3>
        <div className="text-xs text-[#8B9AA0]">{rows.length} registradas</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[#8B9AA0] bg-[#1C2224]">
              {["Código", "Nombre", "Dirección", "Contacto", "Activa"].map((h, idx, arr) => (
                <Th key={h} isLast={idx === arr.length - 1}>{h}</Th>
              ))}
            </tr>
          </thead>

          <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
            {isEmpty && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#8B9AA0]">
                  No hay bodegas registradas.
                </td>
              </tr>
            )}

            {!isEmpty &&
              rows.map((b, i) => (
                <tr
                  key={b.bodegaID}
                  className={`
                    transition-colors
                    ${i % 2 === 0 ? "bg-white/[.02]" : "bg-transparent"}
                    hover:bg-white/[.06]
                  `}
                >
                  <Td>{b.codigo ?? "—"}</Td>
                  <Td className="font-medium">{b.nombre}</Td>
                  <Td>{b.direccion ?? "—"}</Td>
                  <Td>{b.contacto ?? "—"}</Td>
                  <Td>
                    <span
                      className={[
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                        b.isActive
                          ? "bg-[#95B64F]/18 text-[#95B64F] border-[#95B64F]/35"
                          : "bg-white/5 text-[#8B9AA0] border-white/10"
                      ].join(" ")}
                    >
                      <span className={`text-[10px] ${b.isActive ? "text-[#95B64F]" : "text-[#8B9AA0]"}`}>●</span>
                      {b.isActive ? "Sí" : "No"}
                    </span>
                  </Td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Footer fino */}
      <div className="px-4 py-2 text-xs text-[#8B9AA0] border-t border-white/10">
        Consejo: usa el buscador de la página para filtrar por nombre o código.
      </div>
    </div>
  );
}

/* ---- pequeños helpers presentacionales ---- */

const Th: React.FC<React.PropsWithChildren<{ isLast?: boolean }>> = ({ children, isLast }) => (
  <th
    className={[
      "px-4 py-2.5 font-semibold",
      !isLast && "border-r border-white/5"
    ].join(" ")}
  >
    {children}
  </th>
);

const Td: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = "" }) => (
  <td className={["px-4 py-3 text-sm", className].join(" ")}>{children}</td>
);
