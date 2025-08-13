import React from "react";
import SectionHeader from "../../components/SectionHeader";

export default function DescuentosProductoPage() {
    return (
        <div className="p-6">
            <SectionHeader
                title="Descuentos por producto"
                subtitle="Crear descuentos específicos para artículos"
            />

            <div className="card" style={{ marginBottom: 16 }}>
                <h2>Nueva regla de descuento</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>Producto</label>
                        <input className="card" style={inputLike} placeholder="Ej: Shampoo 500ml" />
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>Tipo</label>
                        <select className="card" style={inputLike}>
                            <option>Porcentaje (%)</option>
                            <option>Monto fijo</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>Valor</label>
                        <input type="number" className="card" style={inputLike} placeholder="Ej: 10" />
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>Rango de fechas</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <input type="date" className="card" style={inputLike} />
                            <input type="date" className="card" style={inputLike} />
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                    <button className="btn btn-outline">Limpiar</button>
                    <button className="btn btn-primary">Guardar descuento</button>
                </div>
            </div>

            <div className="card">
                <h2>Descuentos vigentes</h2>
                <div style={{ overflowX: "auto", marginTop: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#F5F5F5" }}>
                                <th style={th}>Producto</th>
                                <th style={th}>Tipo</th>
                                <th style={th}>Valor</th>
                                <th style={th}>Desde</th>
                                <th style={th}>Hasta</th>
                                <th style={{ ...th, textAlign: "right" }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={tr}>
                                <td style={td}>Shampoo 500ml</td>
                                <td style={td}>%</td>
                                <td style={tdStrong}>10%</td>
                                <td style={td}>2025-08-01</td>
                                <td style={td}>2025-08-31</td>
                                <td style={{ ...td, textAlign: "right" }}>
                                    <button className="btn btn-outline">Editar</button>{" "}
                                    <button className="btn" style={{ background: "#C62828", color: "#fff" }}>Eliminar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 14, color: "#333" };
const tr: React.CSSProperties = { borderTop: "1px solid #EAEAEA" };
const td: React.CSSProperties = { padding: "10px 12px", color: "#555", fontSize: 14 };
const tdStrong: React.CSSProperties = { ...td, color: "#333", fontWeight: 600 };
const inputLike: React.CSSProperties = { padding: 10, borderRadius: 8, border: "1px solid #E0E0E0", outline: "none", width: "100%" };
