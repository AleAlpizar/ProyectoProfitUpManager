import React, { useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function RegistrarVentaPage() {
    const [showCancel, setShowCancel] = useState(false);

    return (
        <div className="p-6">
            <SectionHeader
                title="Registrar venta"
                subtitle="Formulario visual: cliente, productos, descuentos e inventario"
            />

            <div className="card" style={{ marginBottom: 16 }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 12,
                    }}
                >
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>
                            Cliente
                        </label>
                        <select className="card" style={inputLike}>
                            <option>Cliente VIP #1001</option>
                            <option>Cliente Regular #2033</option>
                            <option>Cliente Frecuente #3044</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>
                            Fecha
                        </label>
                        <input type="date" className="card" style={inputLike} />
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>
                            Observaciones
                        </label>
                        <input className="card" style={inputLike} placeholder="Opcional" />
                    </div>
                    <div style={{ display: "flex", alignItems: "end", justifyContent: "flex-end" }}>
                        <button
                            className="btn"
                            style={{ background: "#C62828", color: "#fff" }}
                            onClick={() => setShowCancel(true)}
                        >
                            Anular venta
                        </button>
                    </div>
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                <div className="card-alt">
                    <div className="text-gray" style={{ fontSize: 12 }}>Vínculo a cliente</div>
                    <div style={{ marginTop: 6 }}>
                        <span className="badge-success">Venta vinculada a cliente- (Lucia)</span>
                    </div>
                </div>
                <div className="card-alt">
                    <div className="text-gray" style={{ fontSize: 12 }}>Vínculo a inventario</div>
                    <div style={{ marginTop: 6 }}>
                        <span className="badge-success">Vinculación a inventario </span>
                    </div>
                </div>
                <div className="card-alt">
                    <div className="text-gray" style={{ fontSize: 12 }}>Reducción de stock</div>
                    <div style={{ marginTop: 6 }}>
                        <span className="badge-success"> Reducción automática</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>Productos vendidos</h2>
                    <button className="btn btn-primary">+ Agregar producto</button>
                </div>

                <div style={{ overflowX: "auto", marginTop: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#F5F5F5" }}>
                                <th style={th}>Producto</th>
                                <th style={th}>Cant.</th>
                                <th style={th}>Precio</th>
                                <th style={th}>Desc. (%)</th>
                                <th style={th}>Subtotal</th>
                                <th style={{ ...th, textAlign: "right" }}>—</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={tr}>
                                <td style={td}>
                                    <input className="card" style={inputLike} placeholder="Producto A" />
                                </td>
                                <td style={td}>
                                    <input type="number" defaultValue={1} className="card" style={{ ...inputLike, width: 90 }} />
                                </td>
                                <td style={td}>
                                    <input type="number" defaultValue={250} className="card" style={{ ...inputLike, width: 120 }} />
                                </td>
                                <td style={td}>
                                    <input type="number" defaultValue={10} className="card" style={{ ...inputLike, width: 100 }} />
                                </td>
                                <td style={tdStrong}>$225.00</td>
                                <td style={{ ...td, textAlign: "right" }}>
                                    <button className="btn" style={{ background: "#555", color: "#fff" }}>Quitar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ display: "flex", gap: 24, justifyContent: "flex-end", marginTop: 12 }}>
                    <div style={{ textAlign: "right" }}>
                        <div className="text-gray" style={{ fontSize: 13 }}>Subtotal</div>
                        <div style={{ fontWeight: 600 }}>$225.00</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div className="text-gray" style={{ fontSize: 13 }}>Impuestos</div>
                        <div style={{ fontWeight: 600 }}>$29.25</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div className="text-gray" style={{ fontSize: 13 }}>Total</div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>$254.25</div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                    <button className="btn btn-outline">Guardar borrador</button>
                    <button className="btn btn-primary">Registrar venta</button>
                </div>
            </div>

            <ConfirmDialog
                open={showCancel}
                title="Anular venta"
                message="¿Deseas anular esta venta? Se restauraría el inventario si aplica."
                onClose={() => setShowCancel(false)}
                confirmText="Anular"
            />
        </div>
    );
}

const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 14, color: "#333333" };
const tr: React.CSSProperties = { borderTop: "1px solid #EAEAEA" };
const td: React.CSSProperties = { padding: "10px 12px", color: "#555555", fontSize: 14 };
const tdStrong: React.CSSProperties = { ...td, color: "#333333", fontWeight: 600 };
const inputLike: React.CSSProperties = { padding: 10, borderRadius: 8, border: "1px solid #E0E0E0", outline: "none", width: "100%" };

