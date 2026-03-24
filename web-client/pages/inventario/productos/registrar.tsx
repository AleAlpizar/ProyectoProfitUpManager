import React from "react";
import SectionHeader from "../../../components/SectionHeader";
import ProductoCreateForm from "../../../components/productos/ProductoCreateForm";

export default function RegistrarProductoPage() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-2">
        <SectionHeader
          title="Registrar producto"
          subtitle="Da de alta un nuevo artículo en el inventario"
        />
      </div>

      <ProductoCreateForm />
    </div>
  );
}