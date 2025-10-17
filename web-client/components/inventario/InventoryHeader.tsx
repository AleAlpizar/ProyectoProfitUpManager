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
    <header className="mb-6">
      <h1
        className="
          text-3xl sm:text-4xl font-extrabold tracking-tight
          bg-gradient-to-r from-[#A30862] to-[#95B64F]
          bg-clip-text text-transparent
          drop-shadow-[0_2px_8px_rgba(0,0,0,.35)]
        "
      >
        {title}
      </h1>

      <p className="mt-2 text-sm text-[#8B9AA0]">{subtitle}</p>

      <div className="mt-4 h-px w-full bg-gradient-to-r from-[#A30862]/40 via-transparent to-[#95B64F]/40" />
    </header>
  );
};

export default InventoryHeader;
