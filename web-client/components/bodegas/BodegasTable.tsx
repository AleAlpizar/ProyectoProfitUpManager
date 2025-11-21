"use client";
import React from "react";
import type { BodegaDto } from "@/components/hooks/useBodegas";

type Props = { rows: BodegaDto[] };

export default function BodegasTable({ rows }: Props) {
  const isEmpty = !rows || rows.length === 0;

  return (
    <div className="space-y-3">
      <header>
        <nav className="mb-2 flex items-center text-sm text-[#8B9AA0]">
          <div className="flex items-center gap-1">
            <svg
              className="h-4 w-4 opacity-80"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M3 10.25 12 3l9 7.25V21a1 1 0 0 1-1 1h-5.5v-6.5h-5V22H4a1 1 0 0 1-1-1v-10.75Z" />
            </svg>
            <span>Inicio</span>
          </div>

          <span className="mx-2 text-[#4B5563]">/</span>

          <div className="flex items-center gap-1 text-white">
            <svg
              className="h-4 w-4 opacity-80"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M4 10a2 2 0 0 1 1-1.73l7-3.5a2 2 0 0 1 1.8 0l7 3.5A2 2 0 0 1 21 10v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
            </svg>
            <span>Bodegas</span>
          </div>
        </nav>
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121618] text-[#E6E9EA] shadow-[0_10px_30px_rgba(0,0,0,.25)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#1C2224] px-4 py-3">
          <h3 className="text-sm font-semibold tracking-wide">Bodegas</h3>
          <div className="text-xs text-[#8B9AA0]">{rows.length} registradas</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#1C2224] text-left text-[11px] uppercase tracking-wide text-[#8B9AA0]">
                {["Código", "Nombre", "Dirección", "Contacto", "Activa"].map(
                  (h, i, arr) => (
                    <Th key={h} isLast={i === arr.length - 1}>
                      {h}
                    </Th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10">
              {isEmpty && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-[#8B9AA0]"
                  >
                    No hay bodegas registradas.
                  </td>
                </tr>
              )}

              {!isEmpty &&
                rows.map((b, i) => {
                  const active =
                    typeof b.isActive === "number"
                      ? b.isActive === 1
                      : !!b.isActive;
                  return (
                    <tr
                      key={b.bodegaID}
                      className={`transition-colors ${
                        i % 2 === 0 ? "bg-white/[.02]" : "bg-transparent"
                      } hover:bg-white/[.06]`}
                    >
                      <Td>{b.codigo ?? "—"}</Td>
                      <Td className="font-medium">{b.nombre}</Td>
                      <Td>{b.direccion ?? "—"}</Td>
                      <Td>{b.contacto ?? "—"}</Td>
                      <Td>
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                            active
                              ? "bg-[#95B64F]/18 text-[#95B64F] border-[#95B64F]/35"
                              : "bg-white/5 text-[#8B9AA0] border-white/10",
                          ].join(" ")}
                        >
                          <span
                            className={`text-[10px] ${
                              active ? "text-[#95B64F]" : "text-[#8B9AA0]"
                            }`}
                          >
                            ●
                          </span>
                          {active ? "Sí" : "No"}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/10 px-4 py-2 text-xs text-[#8B9AA0]">
          Consejo: usa el buscador de la página para filtrar por nombre o código.
        </div>
      </div>
    </div>
  );
}

const Th: React.FC<React.PropsWithChildren<{ isLast?: boolean }>> = ({
  children,
  isLast,
}) => (
  <th
    className={[
      "px-4 py-2.5 font-semibold",
      !isLast && "border-r border-white/5",
    ].join(" ")}
  >
    {children}
  </th>
);

const Td: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = "",
}) => (
  <td className={["px-4 py-3 text-sm", className].join(" ")}>{children}</td>
);
