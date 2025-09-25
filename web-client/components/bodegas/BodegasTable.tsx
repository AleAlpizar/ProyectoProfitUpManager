"use client";

import React from "react";
import type { BodegaDto } from "@/components/hooks/useBodegas";

export default function BodegasTable({ rows }: { rows: BodegaDto[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            {["Código", "Nombre", "Dirección", "Contacto", "Activa"].map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((b, i) => (
            <tr key={b.bodegaID} className={i % 2 ? "bg-white" : "bg-gray-50/40"}>
              <td className="px-4 py-3 text-sm">{b.codigo ?? "-"}</td>
              <td className="px-4 py-3 text-sm font-medium">{b.nombre}</td>
              <td className="px-4 py-3 text-sm">{b.direccion ?? "-"}</td>
              <td className="px-4 py-3 text-sm">{b.contacto ?? "-"}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                  b.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  ● {b.isActive ? "Sí" : "No"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
