"use client";
import * as React from "react";
import { useProductosMini } from "../hooks/useProductosMini";

type Props = {
  value: number | "";
  onChange: (v: number | "") => void;
};

export const ProductoFiltroDropdown: React.FC<Props> = ({
  value,
  onChange,
}) => {
  const { data: productos = [], loading, error } = useProductosMini();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel = React.useMemo(() => {
    if (loading) return "Cargando…";
    if (error) return "Error al cargar";
    if (value === "") return "Todos";
    const p = productos.find((x) => x.productoID === value);
    return p ? p.nombre : "Todos";
  }, [loading, error, value, productos]);

  const handleSelect = (v: number | "") => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !loading && setOpen((o) => !o)}
        className="flex min-w-[240px] items-center justify-between rounded-2xl border border-white/10 bg-[#111518] px-3.5 py-2.5 text-sm text-white shadow-sm outline-none transition hover:border-white/20 hover:bg-[#151A1D] disabled:opacity-50"
        disabled={loading}
      >
        <span className="truncate text-left">{currentLabel}</span>
        <span className="ml-3 text-white/50">▾</span>
      </button>

      {open && !loading && (
        <div className="absolute z-30 mt-2 w-full min-w-[240px] max-h-72 overflow-auto rounded-2xl border border-white/10 bg-[#0D1113] p-1 shadow-[0_18px_40px_rgba(0,0,0,.45)]">
          <button
            type="button"
            onClick={() => handleSelect("")}
            className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
              value === ""
                ? "bg-[#1c2224] font-medium text-white"
                : "text-white/80 hover:bg-[#1c2224] hover:text-white"
            }`}
          >
            Todos
          </button>

          {productos.map((p) => (
            <button
              key={p.productoID}
              type="button"
              onClick={() => handleSelect(p.productoID)}
              className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                value === p.productoID
                  ? "bg-[#1c2224] font-medium text-white"
                  : "text-white/80 hover:bg-[#1c2224] hover:text-white"
              }`}
            >
              {p.nombre}
            </button>
          ))}

          {productos.length === 0 && !loading && !error && (
            <div className="px-3 py-2.5 text-sm text-white/60">
              No hay productos.
            </div>
          )}

          {error && (
            <div className="px-3 py-2.5 text-sm text-rose-300">{error}</div>
          )}
        </div>
      )}
    </div>
  );
};