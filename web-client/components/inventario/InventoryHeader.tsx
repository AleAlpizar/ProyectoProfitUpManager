import React from "react";

const InventoryHeader: React.FC = () => {
  return (
    <header className="mb-6">
      <h1
        className="
          text-3xl sm:text-4xl font-extrabold tracking-tight
          bg-gradient-to-r from-emerald-400 to-teal-300
          bg-clip-text text-transparent
        "
      >
        Inventario
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Gestión de productos y movimientos
      </p>
    </header>
  );
};

export default InventoryHeader;
