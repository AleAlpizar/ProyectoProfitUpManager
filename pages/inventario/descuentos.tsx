import React, { useMemo, useState } from "react";
import SectionHeader from "../../components/SectionHeader";

type Discount = {
  id: string;
  producto: string;
  sku: string;
  tipo: "Porcentaje" | "Monto fijo";
  valor: number;
  desde: string;
  hasta: string;
};

const SEED: Discount[] = [
  {
    id: "DSC-001",
    producto: "Cabernet Sauvignon Reserva 750ml",
    sku: "CAB-RES-750",
    tipo: "Porcentaje",
    valor: 10,
    desde: "2025-08-01",
    hasta: "2025-08-31",
  },
  {
    id: "DSC-002",
    producto: "Malbec Gran Cosecha 750ml",
    sku: "MLB-GC-750",
    tipo: "Monto fijo",
    valor: 1200,
    desde: "2025-08-10",
    hasta: "2025-09-10",
  },
];

export default function DescuentosProductoPage() {
  const [rows] = useState<Discount[]>(SEED);

  const [producto, setProducto] = useState("");
  const [sku, setSku] = useState("");
  const [tipo, setTipo] = useState<"Porcentaje" | "Monto fijo">("Porcentaje");
  const [valor, setValor] = useState<number | "">("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const t = q.trim().toLowerCase();
    return rows.filter((r) =>
      (r.producto + " " + r.sku).toLowerCase().includes(t)
    );
  }, [q, rows]);

  return (
    <div className="p-6">
      <SectionHeader title="Descuentos por producto" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Kpi label="Reglas activas" value={rows.length} />
        <Kpi
          label="Con % aplicado"
          value={rows.filter((r) => r.tipo === "Porcentaje").length}
        />
        <Kpi
          label="Con monto fijo"
          value={rows.filter((r) => r.tipo === "Monto fijo").length}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Nueva regla de descuento</h2>
          <div className="flex gap-2">
            <button
              className="rounded-xl border border-neutral-300 px-4 py-2 hover:bg-neutral-50"
              onClick={() => {
                setProducto("");
                setSku("");
                setTipo("Porcentaje");
                setValor("");
                setDesde("");
                setHasta("");
              }}
            >
              Limpiar
            </button>
            <button className="rounded-xl bg-emerald-700 text-white px-4 py-2 hover:bg-emerald-800">
              Guardar (visual)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field
            label="Producto"
            placeholder="Ej: Cabernet Sauvignon 750ml"
            value={producto}
            onChange={setProducto}
          />
          <Field
            label="SKU"
            placeholder="Ej: CAB-RES-750"
            value={sku}
            onChange={setSku}
          />
          <Select
            label="Tipo"
            value={tipo}
            onChange={(v) => setTipo(v as any)}
            options={["Porcentaje", "Monto fijo"]}
          />
          <Field
            label={tipo === "Porcentaje" ? "Valor (%)" : "Valor (₡)"}
            type="number"
            placeholder={tipo === "Porcentaje" ? "Ej: 10" : "Ej: 1200"}
            value={valor as any}
            onChange={(v) => setValor(v as any)}
          />

          <div className="md:col-span-2">
            <label className="text-sm text-neutral-500">Rango de fechas</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-neutral-500">Notas (opcional)</label>
            <textarea
              placeholder="Descripción interna de la promoción…"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Descuentos vigentes</h2>
          <div className="w-full sm:w-80">
            <label className="text-sm text-neutral-500">Buscar</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Producto o SKU…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-600">
                {["Producto", "SKU", "Tipo", "Valor", "Desde", "Hasta", ""].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`px-3 py-2 font-semibold ${
                        i === 6 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2">{r.producto}</td>
                  <td className="px-3 py-2">{r.sku}</td>
                  <td className="px-3 py-2">
                    {r.tipo === "Porcentaje" ? "Porcentaje (%)" : "Monto fijo"}
                  </td>
                  <td className="px-3 py-2 font-semibold">
                    {r.tipo === "Porcentaje"
                      ? `${r.valor}%`
                      : `₡${r.valor.toLocaleString("es-CR")}`}
                  </td>
                  <td className="px-3 py-2">{r.desde}</td>
                  <td className="px-3 py-2">{r.hasta}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2 justify-end">
                      <button className="rounded-xl border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50">
                        Editar
                      </button>
                      <button className="rounded-xl bg-red-700 text-white px-3 py-1.5 hover:bg-red-800">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-neutral-500"
                  >
                    No hay resultados con el criterio actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl ring-1 ring-neutral-200 bg-neutral-50 p-4">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm text-neutral-500">{label}</label>
      <input
        type={type}
        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        value={value}
        onChange={(e) =>
          onChange(
            (type === "number" ? Number(e.target.value) : e.target.value) as any
          )
        }
        placeholder={placeholder}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-sm text-neutral-500">{label}</label>
      <select
        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
