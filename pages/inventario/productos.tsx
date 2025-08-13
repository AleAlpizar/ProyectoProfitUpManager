import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";

type Prod = {
    id: string;
    nombre: string;
    sku: string;
    varietal: string;
    anada: number;
    region: string;
    unidad: "Unidad" | "Caja";
    bodega: "Central" | "Norte" | "Sur";
    estado: "Activo" | "Inactivo";
    existencia: number;
};

const SEED: Prod[] = [
    {
        id: "VN-001",
        nombre: "Cabernet Sauvignon Reserva",
        sku: "CAB-RES-750",
        varietal: "Cabernet Sauvignon",
        anada: 2020,
        region: "Valle de Colchagua",
        unidad: "Unidad",
        bodega: "Central",
        estado: "Activo",
        existencia: 180,
    },
    {
        id: "VN-002",
        nombre: "Malbec Gran Cosecha",
        sku: "MLB-GC-750",
        varietal: "Malbec",
        anada: 2019,
        region: "Mendoza",
        unidad: "Caja",
        bodega: "Norte",
        estado: "Activo",
        existencia: 72,
    },
    {
        id: "VN-003",
        nombre: "Merlot Roble",
        sku: "MRL-RBL-750",
        varietal: "Merlot",
        anada: 2021,
        region: "Valle del Maipo",
        unidad: "Unidad",
        bodega: "Sur",
        estado: "Inactivo",
        existencia: 0,
    },
];

export default function ProductosInvPage() {
    const [rows] = useState<Prod[]>(SEED);

    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Prod | null>(null);
    const [openInactivate, setOpenInactivate] = useState<null | string>(null);
    const [openAssign, setOpenAssign] = useState<Prod | null>(null);
    const [openAdjust, setOpenAdjust] = useState<Prod | null>(null);

    const [q, setQ] = useState("");
    const [fBodega, setFBodega] = useState<"Todas" | "Central" | "Norte" | "Sur">("Todas");
    const [fEstado, setFEstado] = useState<"Todos" | "Activo" | "Inactivo">("Todos");
    const [fUnidad, setFUnidad] = useState<"Todas" | "Unidad" | "Caja">("Todas");

    useEffect(() => {
        const any = openForm || openInactivate || openAssign || openAdjust;
        document.body.classList.toggle("modal-open", !!any);
    }, [openForm, openInactivate, openAssign, openAdjust]);

    const filtered = useMemo(() => {
        return rows.filter((r) => {
            const text = `${r.nombre} ${r.sku} ${r.varietal} ${r.region}`.toLowerCase();
            const okQ = q.trim() ? text.includes(q.trim().toLowerCase()) : true;
            const okB = fBodega === "Todas" ? true : r.bodega === fBodega;
            const okE = fEstado === "Todos" ? true : r.estado === fEstado;
            const okU = fUnidad === "Todas" ? true : r.unidad === fUnidad;
            return okQ && okB && okE && okU;
        });
    }, [rows, q, fBodega, fEstado, fUnidad]);

    const kpis = useMemo(() => {
        const totalSku = rows.length;
        const activos = rows.filter((r) => r.estado === "Activo").length;
        const inactivos = totalSku - activos;
        const stock = rows.reduce((acc, r) => acc + r.existencia, 0);
        return { totalSku, activos, inactivos, stock };
    }, [rows]);

    return (
        <div className="p-6">
            <SectionHeader
                title="Inventario de vinos"
                subtitle="Gestión visual de catálogo, bodegas y stock"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <Kpi label="SKUs" value={kpis.totalSku} />
                <Kpi label="Activos" value={kpis.activos} tone="success" />
                <Kpi label="Inactivos" value={kpis.inactivos} tone="alert" />
                <Kpi label="Stock total (botellas)" value={kpis.stock} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 mb-4">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                    <div className="flex-1">
                        <label className="text-sm text-neutral-500">Buscar</label>
                        <input
                            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Nombre, SKU, varietal o región…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>

                    <Select label="Bodega" value={fBodega} onChange={setFBodega} options={["Todas", "Central", "Norte", "Sur"]} />
                    <Select label="Estado" value={fEstado} onChange={setFEstado} options={["Todos", "Activo", "Inactivo"]} />
                    <Select label="Unidad" value={fUnidad} onChange={setFUnidad} options={["Todas", "Unidad", "Caja"]} />

                    <div className="lg:ml-auto">
                        <button
                            onClick={() => { setEditing(null); setOpenForm(true); }}
                            className="w-full lg:w-auto inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 transition"
                        >
                            <span className="text-lg leading-none">＋</span>
                            Registrar vino
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
                <h2 className="text-lg font-semibold mb-2">Catálogo</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-neutral-50 text-neutral-600">
                                {["ID", "Vino", "SKU", "Varietal", "Añada", "Región", "Unidad", "Bodega", "Stock", "Estado", ""].map((h, i) => (
                                    <th key={i} className={`px-3 py-2 font-semibold ${i === 10 ? "text-right" : "text-left"}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id} className="border-t border-neutral-200">
                                    <td className="px-3 py-2 font-semibold text-neutral-800">{p.id}</td>
                                    <td className="px-3 py-2">{p.nombre}</td>
                                    <td className="px-3 py-2">{p.sku}</td>
                                    <td className="px-3 py-2">{p.varietal}</td>
                                    <td className="px-3 py-2">{p.anada}</td>
                                    <td className="px-3 py-2">{p.region}</td>
                                    <td className="px-3 py-2">{p.unidad}</td>
                                    <td className="px-3 py-2">{p.bodega}</td>
                                    <td className="px-3 py-2 font-semibold">{p.existencia}</td>
                                    <td className="px-3 py-2">
                                        {p.estado === "Activo" ? (
                                            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-semibold">
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">
                                                Inactivo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            <button
                                                className="rounded-xl border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
                                                onClick={() => { setEditing(p); setOpenForm(true); }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="rounded-xl bg-neutral-700 text-white px-3 py-1.5 hover:bg-neutral-800"
                                                onClick={() => setOpenAssign(p)}
                                            >
                                                Asignar bodega
                                            </button>
                                            <button
                                                className="rounded-xl bg-emerald-700 text-white px-3 py-1.5 hover:bg-emerald-800"
                                                onClick={() => setOpenAdjust(p)}
                                            >
                                                Ajuste stock
                                            </button>
                                            <button
                                                className="rounded-xl bg-red-700 text-white px-3 py-1.5 hover:bg-red-800"
                                                onClick={() => setOpenInactivate(p.id)}
                                            >
                                                {p.estado === "Activo" ? "Inactivar" : "Reactivar"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="px-3 py-6 text-center text-neutral-500">
                                        No hay resultados con los filtros actuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {openForm && (
                <Modal onClose={() => setOpenForm(false)}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-semibold">{editing ? "Editar vino" : "Registrar vino"}</h2>
                        <button
                            className="rounded-xl bg-emerald-700 text-white px-3 py-1.5 hover:bg-emerald-800"
                            onClick={() => setOpenForm(false)}
                        >
                            Cerrar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <Field label="Nombre del vino" defaultValue={editing?.nombre} />
                        <Field label="SKU / Código" defaultValue={editing?.sku} />
                        <Select
                            label={
                                <span>
                                    Unidad{" "}
                                    <span className="ml-1 inline-flex text-xs rounded-full bg-emerald-100 text-emerald-800 px-2">
                                        INV-003-020
                                    </span>
                                </span>
                            }
                            options={["Unidad", "Caja"]}
                            value={editing?.unidad ?? "Unidad"}
                            onChange={() => { }}
                        />
                        <Select
                            label="Bodega por defecto"
                            options={["Central", "Norte", "Sur"]}
                            value={editing?.bodega ?? "Central"}
                            onChange={() => { }}
                        />

                        <Select
                            label="Varietal"
                            options={["Cabernet Sauvignon", "Malbec", "Merlot", "Syrah", "Pinot Noir", "Tempranillo"]}
                            value={editing?.varietal ?? "Cabernet Sauvignon"}
                            onChange={() => { }}
                        />
                        <Field label="Añada" type="number" defaultValue={editing?.anada ?? 2021} />
                        <Field label="Región" defaultValue={editing?.region ?? "Valle del Maipo"} />
                        <Field label="Precio referencial (opcional)" placeholder="$" />

                        <div className="md:col-span-4">
                            <label className="text-sm text-neutral-500">Notas / Cata</label>
                            <textarea
                                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                                placeholder="Aromas a frutos rojos, taninos suaves…"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            className="rounded-xl border border-neutral-300 px-4 py-2 hover:bg-neutral-50"
                            onClick={() => setOpenForm(false)}
                        >
                            Cancelar
                        </button>
                        <button className="rounded-xl bg-emerald-700 text-white px-4 py-2 hover:bg-emerald-800">
                            {editing ? "Guardar cambios (visual)" : "Registrar (visual)"}
                        </button>
                    </div>
                </Modal>
            )}

            {openAssign && (
                <Modal onClose={() => setOpenAssign(null)}>
                    <h2 className="text-xl font-semibold mb-3">
                        Asignar bodega a <span className="font-bold">{openAssign.nombre}</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select label="Bodega" options={["Central", "Norte", "Sur"]} value={openAssign.bodega} onChange={() => { }} />
                        <Field label="Ubicación (estante/pasillo)" placeholder="Ej: A-3 / P-2" />
                        <Field label="Mínimo sugerido" type="number" placeholder="Ej: 24" />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="rounded-xl border border-neutral-300 px-4 py-2 hover:bg-neutral-50" onClick={() => setOpenAssign(null)}>
                            Cerrar
                        </button>
                        <button className="rounded-xl bg-emerald-700 text-white px-4 py-2 hover:bg-emerald-800">
                            Asignar (visual)
                        </button>
                    </div>
                </Modal>
            )}

            {openAdjust && (
                <Modal onClose={() => setOpenAdjust(null)}>
                    <h2 className="text-xl font-semibold mb-3">Ajuste manual de stock</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Field label="Vino" defaultValue={openAdjust.nombre} disabled />
                        <Field label="Stock actual" defaultValue={openAdjust.existencia} disabled />
                        <Field label="Nuevo stock" type="number" placeholder="Ej: 300" />
                        <Field label="Motivo" placeholder="Auditoría / Daño / Ajuste" className="md:col-span-3" />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="rounded-xl border border-neutral-300 px-4 py-2 hover:bg-neutral-50" onClick={() => setOpenAdjust(null)}>
                            Cancelar
                        </button>
                        <button className="rounded-xl bg-emerald-700 text-white px-4 py-2 hover:bg-emerald-800">
                            Aplicar (visual)
                        </button>
                    </div>
                </Modal>
            )}

            <ConfirmDialog
                open={!!openInactivate}
                title="Cambio de estado"
                message={`¿Deseas cambiar el estado del producto ${openInactivate}? (solo visual)`}
                onClose={() => setOpenInactivate(null)}
                confirmText="Confirmar"
            />
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

function Select({
    label, value, onChange, options, className = "",
}: {
    label: React.ReactNode;
    value: string;
    onChange: (v: any) => void;
    options: string[];
    className?: string;
}) {
    return (
        <div className={`w-full ${className}`}>
            <label className="text-sm text-neutral-500">{label}</label>
            <select
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                ))}
            </select>
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
        <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
