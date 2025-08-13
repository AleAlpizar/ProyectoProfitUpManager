import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";

type Row = {
    id: string;
    proveedor: string;
    fechaEstimada: string;
    estado: "Pendiente" | "Anulada";
    total: string;
};

const FAKE_ROWS: Row[] = [
    { id: "OC-0001", proveedor: "Proveedor A", fechaEstimada: "2025-08-20", estado: "Pendiente", total: "$1,240" },
    { id: "OC-0002", proveedor: "Proveedor B", fechaEstimada: "2025-08-22", estado: "Pendiente", total: "$980" },
];

export default function OrdenesComprasPage() {
    const [rows, setRows] = useState<Row[]>(FAKE_ROWS);

    const [showCancel, setShowCancel] = useState(false);
    const [targetId, setTargetId] = useState<string | null>(null);

    const [formOpen, setFormOpen] = useState(false);
    const [editData, setEditData] = useState<Row | null>(null);

    useEffect(() => {
        if (formOpen) document.body.classList.add("modal-open");
        else document.body.classList.remove("modal-open");
        return () => document.body.classList.remove("modal-open");
    }, [formOpen]);

    const title = useMemo(
        () => (editData ? "Editar orden de compra" : "Registrar orden de compra"),
        [editData]
    );

    return (
        <div className="p-6">
            <SectionHeader
                title="Órdenes de compra"
                subtitle="Registrar, editar y anular solicitudes"
            />

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditData(null);
                        setFormOpen(true);
                    }}
                >
                    + Nueva orden
                </button>
            </div>

            <div className="card">
                <h2>Órdenes pendientes</h2>
                <div style={{ overflowX: "auto", marginTop: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#F5F5F5" }}>
                                <th style={th}>#</th>
                                <th style={th}>Proveedor</th>
                                <th style={th}>Fecha estimada</th>
                                <th style={th}>Estado</th>
                                <th style={th}>Total</th>
                                <th style={{ ...th, textAlign: "right" }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} style={tr}>
                                    <td style={tdStrong}>{r.id}</td>
                                    <td style={td}>{r.proveedor}</td>
                                    <td style={td}>{r.fechaEstimada}</td>
                                    <td style={td}>
                                        {r.estado === "Pendiente" ? (
                                            <span className="badge-success">Pendiente</span>
                                        ) : (
                                            <span className="badge-alert">Anulada</span>
                                        )}
                                    </td>
                                    <td style={td}>{r.total}</td>
                                    <td style={{ ...td, textAlign: "right" }}>
                                        <div style={{ display: "inline-flex", gap: 8 }}>
                                            <button
                                                className="btn btn-outline"
                                                onClick={() => {
                                                    setEditData(r);
                                                    setFormOpen(true);
                                                }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ background: "#C62828", color: "#fff" }}
                                                onClick={() => {
                                                    setTargetId(r.id);
                                                    setShowCancel(true);
                                                }}
                                            >
                                                Anular
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td style={td} colSpan={6}>
                                        No hay órdenes pendientes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {formOpen && (
                <div className="modal-overlay" onClick={() => setFormOpen(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <h2>{title}</h2>
                            <button
                                className="btn btn-primary"
                                onClick={() => setFormOpen(false)}
                            >
                                Cerrar
                            </button>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: 12,
                                marginTop: 16,
                            }}
                        >
                            <div>
                                <label className="text-gray" style={{ fontSize: 12 }}>
                                    Proveedor
                                </label>
                                <select className="card" style={inputLike} defaultValue={editData?.proveedor ?? "Proveedor A"}>
                                    <option>Proveedor A</option>
                                    <option>Proveedor B</option>
                                    <option>Proveedor C</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray" style={{ fontSize: 12 }}>
                                    Fecha estimada
                                </label>
                                <input
                                    type="date"
                                    defaultValue={editData?.fechaEstimada}
                                    className="card"
                                    style={inputLike}
                                />
                            </div>
                            <div>
                                <label className="text-gray" style={{ fontSize: 12 }}>
                                    Observaciones
                                </label>
                                <input
                                    placeholder="Opcional"
                                    className="card"
                                    style={inputLike}
                                />
                            </div>
                        </div>

                        <div className="card-alt" style={{ marginTop: 16 }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <h2>Productos solicitados</h2>
                                <button className="btn btn-primary">+ Agregar producto</button>
                            </div>

                            <div style={{ overflowX: "auto", marginTop: 8 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "#F5F5F5" }}>
                                            <th style={th}>Producto</th>
                                            <th style={th}>Cant.</th>
                                            <th style={th}>Precio</th>
                                            <th style={th}>Subtotal</th>
                                            <th style={{ ...th, textAlign: "right" }}>—</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={tr}>
                                            <td style={td}>
                                                <input
                                                    placeholder="Producto X"
                                                    className="card"
                                                    style={inputLike}
                                                />
                                            </td>
                                            <td style={td}>
                                                <input
                                                    type="number"
                                                    defaultValue={1}
                                                    className="card"
                                                    style={{ ...inputLike, width: 90 }}
                                                />
                                            </td>
                                            <td style={td}>
                                                <input
                                                    type="number"
                                                    defaultValue={100}
                                                    className="card"
                                                    style={{ ...inputLike, width: 120 }}
                                                />
                                            </td>
                                            <td style={tdStrong}>$100.00</td>
                                            <td style={{ ...td, textAlign: "right" }}>
                                                <button
                                                    className="btn"
                                                    style={{ background: "#555", color: "#fff" }}
                                                >
                                                    Quitar
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 24,
                                    justifyContent: "flex-end",
                                    marginTop: 12,
                                }}
                            >
                                <div style={{ textAlign: "right" }}>
                                    <div className="text-gray" style={{ fontSize: 13 }}>
                                        Subtotal
                                    </div>
                                    <div style={{ fontWeight: 600 }}>$100.00</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div className="text-gray" style={{ fontSize: 13 }}>
                                        Impuestos
                                    </div>
                                    <div style={{ fontWeight: 600 }}>$13.00</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div className="text-gray" style={{ fontSize: 13 }}>
                                        Total
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: 18 }}>$113.00</div>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                justifyContent: "flex-end",
                                marginTop: 16,
                            }}
                        >
                            <button
                                className="btn btn-outline"
                                onClick={() => setFormOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button className="btn btn-primary">Guardar (visual)</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={showCancel}
                title="Anular orden de compra"
                message={`¿Confirmas anular la orden ${targetId}? ( visual)`}
                onClose={() => setShowCancel(false)}
                onConfirm={() => {
                    setRows((prev) =>
                        prev.map((r) => (r.id === targetId ? { ...r, estado: "Anulada" } : r))
                    );
                }}
                confirmText="Anular"
            />
        </div>
    );
}

const th: React.CSSProperties = {
    padding: "10px 12px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 14,
    color: "#333333",
};
const tr: React.CSSProperties = { borderTop: "1px solid #EAEAEA" };
const td: React.CSSProperties = { padding: "10px 12px", color: "#555555", fontSize: 14 };
const tdStrong: React.CSSProperties = { ...td, color: "#333333", fontWeight: 600 };
const inputLike: React.CSSProperties = {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #E0E0E0",
    outline: "none",
    width: "100%",
};
