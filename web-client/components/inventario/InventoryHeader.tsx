import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
};

const InventoryHeader: React.FC<Props> = ({
  title = "Inventario",
  subtitle = "Gestión de productos y movimientos",
}) => {
  return (
    <header className="mb-8">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 shadow-[0_14px_35px_rgba(0,0,0,.18)]">
        <h1
          className="
            text-3xl font-extrabold tracking-tight sm:text-4xl
            bg-gradient-to-r from-[#A30862] to-[#95B64F]
            bg-clip-text text-transparent
            drop-shadow-[0_2px_8px_rgba(0,0,0,.35)]
          "
        >
          {title}
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#8B9AA0]">{subtitle}</p>

        <div className="mt-4 h-px w-full bg-gradient-to-r from-[#A30862]/40 via-white/5 to-[#95B64F]/40" />
      </div>
    </header>
  );
};

export default InventoryHeader;