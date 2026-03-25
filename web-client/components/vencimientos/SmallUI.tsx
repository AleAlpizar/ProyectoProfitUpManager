import React from "react";
import type { EstadoVto } from "./types";

export const Label: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ className = "", children }) => (
  <label
    className={[
      "mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-white/60",
      className,
    ].join(" ")}
  >
    {children}
  </label>
);

export const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <th className={["px-4 py-3 font-semibold", className].join(" ")}>
    {children}
  </th>
);

export const Td: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <td className={["px-4 py-3 text-white/80 align-middle", className].join(" ")}>
    {children}
  </td>
);

export const EstadoBadge: React.FC<{ estado: EstadoVto }> = ({ estado }) => {
  const map: Record<EstadoVto, string> = {
    VIGENTE: "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30",
    PROXIMO: "bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-400/30",
    VENCIDO: "bg-red-400/20 text-red-300 ring-1 ring-red-400/30",
  };

  const txt =
    estado === "VIGENTE"
      ? "Vigente"
      : estado === "PROXIMO"
      ? "Próximo"
      : "Vencido";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        map[estado],
      ].join(" ")}
    >
      {txt}
    </span>
  );
};

export function fmtISO(dateISO?: string | null) {
  if (!dateISO) return "—";

  const s = String(dateISO);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }

  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  } catch {
    return s;
  }
}