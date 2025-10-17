import React from "react";

type Props = {
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  currency?: string;            
  onAdd?: () => void;           
  loading?: boolean;            
};

export function ProductCard({
  name,
  price,
  stock,
  imageUrl,
  currency = "USD",
  onAdd,
  loading = false,
}: Props) {
  const [imgOk, setImgOk] = React.useState(true);

  const fmt = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format;

  return (
    <div
      className={[
        "group relative max-w-xs overflow-hidden rounded-2xl border",
        "border-white/10 bg-neutral-900 text-white shadow-sm",
        "transition-all hover:shadow-lg hover:border-white/20",
      ].join(" ")}
    >
      <div className="relative h-44 w-full overflow-hidden bg-neutral-800">
        {loading ? (
          <div className="h-full w-full animate-pulse bg-neutral-700/60" />
        ) : imgOk && imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/40">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7v10a2 2 0 0 0 2 2h14" />
              <path d="M21 15V7a2 2 0 0 0-2-2H7" />
              <path d="m3 13 4-4 4 4 4-4 4 4" />
            </svg>
          </div>
        )}

        {!loading && (
          <span
            className={[
              "absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow",
              stock > 0
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                : "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
            ].join(" ")}
          >
            {stock > 0 ? `Stock: ${stock}` : "Agotado"}
          </span>
        )}
      </div>

      <div className="p-4">
        <h2
          className="truncate text-base font-semibold text-white"
          title={name}
        >
          {loading ? (
            <span className="inline-block h-4 w-40 animate-pulse rounded bg-neutral-700/60" />
          ) : (
            name
          )}
        </h2>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-emerald-400">
            {loading ? (
              <span className="inline-block h-5 w-24 animate-pulse rounded bg-neutral-700/60" />
            ) : (
              fmt(price)
            )}
          </span>
          {!loading && (
            <span className="text-xs text-white/50">+ impuestos</span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onAdd}
            disabled={loading || stock <= 0}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium",
              "transition focus:outline-none focus:ring-2 focus:ring-white/20",
              stock > 0
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-neutral-800 text-white/40 cursor-not-allowed",
            ].join(" ")}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
              <circle cx="7" cy="21" r="1" />
              <circle cx="17" cy="21" r="1" />
            </svg>
            {stock > 0 ? "Agregar" : "Sin stock"}
          </button>

          <a
            href="#"
            className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            Ver detalle
          </a>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-emerald-500/5 blur-2xl" />
      </div>
    </div>
  );
}
