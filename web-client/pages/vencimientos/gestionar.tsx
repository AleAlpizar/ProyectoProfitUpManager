import React, { useState } from "react";
import SectionHeader from "../../components/SectionHeader";

type Vencimiento = {
    id: string;
    documento: string;
    fecha: string;
    estado: "Vencido" | "Vigente";
    tipo: "Permiso" | "Seguro" | "Pago" | "Licencia" | "Certificado" | "Contrato";
};

const BASE: Vencimiento[] = [
    { id: "VC-01", documento: "Licencia de funcionamiento", fecha: "2025-08-10", estado: "Vencido", tipo: "Licencia" },
    { id: "VC-02", documento: "Contrato proveedor", fecha: "2025-08-25", estado: "Vigente", tipo: "Contrato" },
    { id: "VC-03", documento: "Permiso sanitario", fecha: "2025-09-05", estado: "Vigente", tipo: "Permiso" },
    { id: "VC-04", documento: "Seguro de bodega", fecha: "2025-08-22", estado: "Vigente", tipo: "Seguro" },
];

const RANGO_ALERTA_DIAS = 7;
const HOY = new Date();
const esProximo = (v: Vencimiento) => {
    const fechaVenc = new Date(v.fecha);
    const diffDias = Math.ceil((fechaVenc.getTime() - HOY.getTime()) / (1000 * 60 * 60 * 24));
    return v.estado === "Vigente" && diffDias >= 0 && diffDias <= RANGO_ALERTA_DIAS;
};

export default function VencimientosPage() {
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Vencimiento | null>(null);

    const datosOrdenados = BASE.slice().sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    const abrirNuevo = () => {
        setEditing(null);
        setOpenForm(true);
    };

    const abrirEditar = (v: Vencimiento) => {
        setEditing(v);
        setOpenForm(true);
    };

    return (
        <div className="p-6">
            <SectionHeader
                title="Vencimientos"
                subtitle="Panel de alertas para la gestión de fechas de vencimiento de documentos"
            />

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Filtros</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-neutral-500 mb-1">Documento</label>
                        <input
                            className="w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Ej: Permiso sanitario"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-neutral-500 mb-1">Fecha</label>
                        <input
                            type="date"
                            className="w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-neutral-500 mb-1">Tipo</label>
                        <select
                            className="w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        >
                            <option value="">Todos</option>
                            <option value="Permiso">Permiso</option>
                            <option value="Seguro">Seguro</option>
                            <option value="Pago">Pago</option>
                            <option value="Licencia">Licencia</option>
                            <option value="Certificado">Certificado</option>
                            <option value="Contrato">Contrato</option>
                        </select>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button className="btn btn-primary w-full sm:w-auto">Buscar</button>
                    <button className="btn btn-outline w-full sm:w-auto">Limpiar</button>
                    <button className="btn btn-emerald w-full sm:w-auto" onClick={abrirNuevo}>Registrar</button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Alertas de vencimiento</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className={th}>Documento</th>
                                <th className={th}>Fecha</th>
                                <th className={th}>Estado</th>
                                <th className={th}>Tipo</th>
                                <th className={th}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datosOrdenados.map((v) => {
                                const proximo = esProximo(v);
                                return (
                                    <tr key={v.id} className={`border-t border-neutral-200 ${proximo ? "bg-yellow-50" : ""}`}>
                                        <td className={td}>{v.documento}</td>
                                        <td className={td}>{v.fecha}</td>
                                        <td className={td}>
                                            {v.estado === "Vigente" ? (
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${proximo ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-800"
                                                        }`}
                                                >
                                                    {proximo ? "Próximo" : "Vigente"}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">
                                                    Vencido
                                                </span>
                                            )}
                                        </td>
                                        <td className={td}>{v.tipo}</td>
                                        <td className={td}>
                                            <button
                                                className="rounded-xl border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
                                                onClick={() => abrirEditar(v)}
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {openForm && (
                <div
                    className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setOpenForm(false)}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold mb-4">
                            {editing ? "Editar vencimiento" : "Registrar vencimiento"}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-neutral-500 mb-1">Documento</label>
                                <input className="w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                            </div>
                            <div>
                                <label className="block text-sm text-neutral-500 mb-1">Fecha</label>
                                <input type="date" className="w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                            </div>
                            <div>
                                <label className="block text-sm text-neutral-500 mb-1">Tipo</label>
                                <select className="w-full rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600">
                                    <option value="">Seleccione tipo</option>
                                    <option value="Permiso">Permiso</option>
                                    <option value="Seguro">Seguro</option>
                                    <option value="Pago">Pago</option>
                                    <option value="Licencia">Licencia</option>
                                    <option value="Certificado">Certificado</option>
                                    <option value="Contrato">Contrato</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                className="rounded-xl border border-neutral-300 px-4 py-2 hover:bg-neutral-50"
                                onClick={() => setOpenForm(false)}
                            >
                                Cancelar
                            </button>
                            <button className="rounded-xl bg-emerald-700 text-white px-4 py-2 hover:bg-emerald-800">
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const th: string = "text-left font-semibold px-4 py-2 text-sm text-neutral-700";
const td: string = "px-4 py-2 text-sm text-neutral-600";















