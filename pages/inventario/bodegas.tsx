import React, { useEffect, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";

type Bodega = { id: string; nombre: string; ubicacion: string; estado: "Activa" | "Inactiva" };

const BASE: Bodega[] = [
    { id: "BG-01", nombre: "Central", ubicacion: "San José", estado: "Activa" },
    { id: "BG-02", nombre: "Norte", ubicacion: "Heredia", estado: "Activa" },
    { id: "BG-03", nombre: "Sur", ubicacion: "Cartago", estado: "Inactiva" },
];

export default function BodegasPage() {
    const [list] = useState<Bodega[]>(BASE);
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Bodega | null>(null);
    const [toToggle, setToToggle] = useState<string | null>(null);

    useEffect(() => {
        document.body.classList.toggle("modal-open", !!(openForm || toToggle));
    }, [openForm, toToggle]);

    return (
        <div className="p-6">
            <SectionHeader
                title="Bodegas"
  
            />
            <div className="mb-4">
                <button
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 transition"
                    onClick={() => { setEditing(null); setOpenForm(true); }}
                >
                    <span className="text-lg leading-none">＋</span>
                    Nueva bodega
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
                <h2 className="text-lg font-semibold mb-4">Listado</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {list.map(b => (
                        <div key={b.id} className="rounded-2xl border border-neutral-200 p-4 bg-white hover:shadow-md transition">
                            <div className="text-xs text-neutral-500">Código</div>
                            <div className="font-bold text-neutral-800">{b.id}</div>

                            <div className="text-xs text-neutral-500 mt-3">Nombre</div>
                            <div className="font-semibold">{b.nombre}</div>

                            <div className="text-xs text-neutral-500 mt-3">Ubicación</div>
                            <div className="font-semibold">{b.ubicacion}</div>

                            <div className="mt-3">
                                {b.estado === "Activa" ? (
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-semibold">
                                        Activa
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">
                                        Inactiva
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button
                                    className="rounded-xl border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
                                    onClick={() => { setEditing(b); setOpenForm(true); }}
                                >
                                    Editar
                                </button>
                                <button
                                    className={`rounded-xl px-3 py-1.5 text-white ${b.estado === "Activa" ? "bg-red-700 hover:bg-red-800" : "bg-emerald-700 hover:bg-emerald-800"
                                        }`}
                                    onClick={() => setToToggle(b.id)}
                                >
                                    {b.estado === "Activa" ? "Inactivar" : "Activar"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {openForm && (
                <Modal onClose={() => setOpenForm(false)}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-semibold">{editing ? "Editar bodega" : "Nueva bodega"}</h2>
                        <button className="rounded-xl bg-emerald-700 text-white px-3 py-1.5 hover:bg-emerald-800" onClick={() => setOpenForm(false)}>
                            Cerrar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Field label="Código" placeholder="BG-XX" defaultValue={editing?.id} />
                        <Field label="Nombre" defaultValue={editing?.nombre} />
                        <Field label="Ubicación" defaultValue={editing?.ubicacion} />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button className="rounded-xl border border-neutral-300 px-4 py-2 hover:bg-neutral-50" onClick={() => setOpenForm(false)}>
                            Cancelar
                        </button>
                        <button className="rounded-xl bg-emerald-700 text-white px-4 py-2 hover:bg-emerald-800">
                            Guardar (visual)
                        </button>
                    </div>
                </Modal>
            )}

            <ConfirmDialog
                open={!!toToggle}
                title="Cambiar estado de bodega"
                message={`¿Confirmas cambiar el estado de ${toToggle}? (solo visual)`}
                confirmText="Confirmar"
                onClose={() => setToToggle(null)}
            />
        </div>
    );
}


function Field({
    label, defaultValue, placeholder,
}: { label: string; defaultValue?: string; placeholder?: string }) {
    return (
        <div>
            <label className="text-sm text-neutral-500">{label}</label>
            <input
                defaultValue={defaultValue}
                placeholder={placeholder}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
        </div>
    );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
