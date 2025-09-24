import SectionHeader from "@/components/SectionHeader";
import ProductForm from "@/components/ProductForm";
import Alert from "@/components/Alert";
import { useInventoryAccess } from "@/hooks/useInventoryAccess";
import { useState } from "react";

export default function ProductosInvPage() {
  const { allowed, loading } = useInventoryAccess("Escribir");
  const [createdId, setCreatedId] = useState<number | null>(null);

  if (loading) return <div className="p-6"><SectionHeader title="Productos" /><Alert>Verificando permisos…</Alert></div>;
  if (allowed === false) return <div className="p-6"><SectionHeader title="Productos" /><Alert type="error">Acceso denegado.</Alert></div>;

  return (
    <div className="p-6">
      <SectionHeader title="Productos" subtitle="Alta de artículos y datos completos" />
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
        {createdId && <div className="mb-3"><Alert type="success">Producto registrado (ID: {createdId})</Alert></div>}
        <ProductForm onCreated={setCreatedId} />
      </div>
    </div>
  );
}
