import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../../components/SectionHeader";

type Row = {
    bodega: "Central" | "Norte" | "Sur";
    producto: string;
    sku: string;
    existencia: number;
};

const FAKE: Row[] = [
    { bodega: "Central", producto: "Cabernet Sauvignon Reserva 750ml", sku: "CAB-RES-750", existencia: 180 },
    { bodega: "Norte", producto: "Malbec Gran Cosecha 750ml", sku: "MLB-GC-750", existencia: 72 },
    { bodega: "Sur", producto: "Merlot Roble 750ml", sku: "MRL-RBL-750", existencia: 0 },
];

export default function ExistenciasPage() {
    const [rows] = useState<Row[]>(FAKE);
    const [openAdjust, setOpenAdjust] = useState<Row | null>(null);

    const [q, setQ] = useState("");
    const [fBodega, setFBodega] = useState<"Todas" | "Central" | "Norte" | "Sur">("Todas");
    const [desde, setDesde] = useState<string>("");
    const [hasta, setHasta] = useState<string>("");

    useEffect(() => {
        document.body.classList.toggle("modal-open", !!openAdjust);
    }, [openAdjust]);

    const filtered = useMemo(() => {
        return rows.filter((r) => {
            const okQ = q.trim()
                ? (r.producto + " " + r.sku).toLowerCase().includes(q.trim().toLowerCase())
                : true;
            const okB = fBodega === "Todas" ? true : r.bodega === fBodega;
           
            return okQ && okB;
        });
    }, [rows, q, fBodega, desde, hasta]);

    const kpis = useMemo(() => {
        const totalItems = rows.length;
        const sinStock = rows.filter((r) => r.existencia <= 0).length;
        const stockTotal = rows.reduce((acc, r) => acc + r.existencia, 0);
        const bodegas = new Set(rows.map((r) => r.bodega)).size;
        return { totalItems, sinStock, stockTotal, bodegas };
    }, [rows]);

    return (
        <div className="p-6">
            <SectionHeader
                title="Existencias por bodega"
  
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <Kpi label="Registros" value={kpis.totalItems} />
                <Kpi label="Sin stock" value={kpis.sinStock} tone="alert" />
                <Kpi label="Stock total (botellas)" value={kpis.stockTotal} />
                <Kpi label="Bodegas" value={kpis.bodegas} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <BadgeCard title="Actualización" chip="Por venta (UI)" />
                <BadgeCard title="Actualización" chip="Por entrega (UI)" />
                <BadgeCard title="Ajuste" chip="Manual (UI)" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 mb-4">
                <h2 className="text-lg font-semibold mb-3">Filtros</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="text-sm text-neutral-500">Bodega</label>
                        <select
                            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            value={fBodega}
                            onChange={(e) => setFBodega(e.target.value as any)}
                        >
                            {["Todas", "Central", "Norte", "Sur"].map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm text-neutral-500">Producto o SKU</label>
                        <input
                            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Buscar…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-neutral-500">Desde</label>
                        <input
                            type="date"
                            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            value={desde}
                            onChange={(e) => setDesde(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-neutral-500">Hasta</label>
                        <input
                            type="date"
                            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            value={hasta}
                            onChange={(e) => setHasta(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
                <h2 className="text-lg font-semibold mb-2">Resultados</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-neutral-50 text-neutral-600">
                                {["Bodega", "Producto", "SKU", "Existencia", ""].map((h, i) => (
                                    <th key={h} className={`px-3 py-2 font-semibold ${i === 4 ? "text-right" : "text-left"}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r) => (
                                <tr key={r.sku + r.bodega} className="border-t border-neutral-200">
                                    <td className="px-3 py-2">{r.bodega}</td>
                                    <td className="px-3 py-2">{r.producto}</td>
                                    <td className="px-3 py-2">{r.sku}</td>
                                    <td className="px-3 py-2 font-semibold">{r.existencia}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex justify-end">
                                            <button
                                                className="rounded-xl bg-emerald-700 text-white px-3 py-1.5 hover:bg-emerald-800"
                                                onClick={() => setOpenAdjust(r)}
                                            >
                                                Ajuste manual
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-6 text-center text-neutral-500">
                                        No hay resultados con los filtros actuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {openAdjust && (
                <Modal onClose={() => setOpenAdjust(null)}>
                    <h2 className="text-xl font-semibold mb-3">Ajuste manual de stock</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Field label="Bodega" defaultValue={openAdjust.bodega} disabled />
                        <Field label="Producto" defaultValue={openAdjust.producto} disabled />
                        <Field label="Existencia actual" defaultValue={openAdjust.existencia} disabled />
                        <Field label="Nueva existencia" type="number" placeholder="Ej: 300" />
                        <Field label="Motivo" placeholder="Auditoría / Daño / Ajuste" className="md:col-span-3" />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            className="rounded-xl border border-neutral-300 px-4 py-2 hover:bg-neutral-50"
                            onClick={() => setOpenAdjust(null)}
                        >
                            Cancelar
                        </button>
                        <button className="rounded-xl bg-emerald-700 text-white px-4 py-2 hover:bg-emerald-800">
                            Aplicar (visual)
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}


function Kpi({ label, value, tone }: { label: string; value: number | string; tone?: "success" | "alert" }) {
    const toneClasses =
        tone === "success"
            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
            : tone === "alert"
                ? "bg-red-50 text-red-700 ring-red-200"
                : "bg-neutral-50 text-neutral-800 ring-neutral-200";
    return (
        <div className={`rounded-2xl ring-1 ${toneClasses} p-4`}>
            <div className="text-sm text-neutral-500">{label}</div>
            <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
    );
}

function BadgeCard({ title, chip }: { title: string; chip: string }) {
    return (
        <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4">
            <div className="text-sm text-neutral-500">{title}</div>
            <div className="mt-1">
                <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-semibold">
                    {chip}
                </span>
            </div>
        </div>
    );
}

function Field({
    label, type = "text", defaultValue, placeholder, disabled, className = "",
}: {
    label: React.ReactNode;
    type?: string;
    defaultValue?: any;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <div className={`w-full ${className}`}>
            <label className="text-sm text-neutral-500">{label}</label>
            <input
                type={type}
                defaultValue={defaultValue}
                placeholder={placeholder}
                disabled={disabled}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 bg-white disabled:bg-neutral-50 disabled:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
        </div>
    );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
