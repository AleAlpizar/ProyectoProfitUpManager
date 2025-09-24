import { useState } from "react";
import { ProductoCreateDto, useProducts } from "@/hooks/useProducts";
import Alert from "./Alert";
import Spinner from "./Spinner";

export default function ProductForm({ onCreated }:{ onCreated:(id:number)=>void }) {
  const { create, loading, error } = useProducts();
  const [form, setForm] = useState<ProductoCreateDto>({
    Nombre: "", PrecioVenta: 0, SKU: ""
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await create(form);
      onCreated(res.productoId);
    } catch {/* handled in hook */}
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Field label="Nombre" required value={form.Nombre} onChange={v=>setForm({...form, Nombre:v})}/>
      <Field label="SKU" value={form.SKU ?? ""} onChange={v=>setForm({...form, SKU:v})}/>
      <Field label="Precio Venta" type="number" required value={form.PrecioVenta} onChange={v=>setForm({...form, PrecioVenta:Number(v)})}/>
      <div className="md:col-span-3">
        <label className="text-sm text-neutral-500">Descripción</label>
        <textarea value={form.Descripcion ?? ""} onChange={e=>setForm({...form, Descripcion:e.target.value})}
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-emerald-600"/>
      </div>

      {error && <div className="md:col-span-3"><Alert type="error">{error.message}</Alert></div>}

      <div className="md:col-span-3 flex justify-end gap-2">
        <button type="submit" className="rounded-xl bg-emerald-700 text-white px-4 py-2 hover:bg-emerald-800 disabled:opacity-60" disabled={loading}>
          {loading ? <span className="inline-flex items-center gap-2"><Spinner/> Registrando…</span> : "Registrar producto"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label, value, onChange, type="text", required
}:{
  label:string; value:any; onChange:(v:string)=>void; type?:string; required?:boolean;
}) {
  return (
    <div className="w-full">
      <label className="text-sm text-neutral-500">{label}{required && <span className="text-red-500">*</span>}</label>
      <input type={type} required={required} value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"/>
    </div>
  );
}
