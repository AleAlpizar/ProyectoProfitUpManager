import React from "react";
import SectionHeader from "../../components/SectionHeader";

export default function HistorialReportesPage() {
    return (
        <div className="p-6">
            <SectionHeader
                title="Historial de reportes"
                subtitle="Consultar qué reportes se han emitido, cuándo y por quién"
            />

            <div className="card" style={{ marginBottom: 16 }}>
                <h2>Filtros</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>Tipo de reporte</label>
                        <select className="card" style={inputLike}>
                            <option>Ventas</option>
                            <option>Inventario</option>
                            <option>Órdenes de compra</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>Usuario</label>
                        <input className="card" style={inputLike} placeholder="Ej: admin@empresa.com" />
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>Desde</label>
                        <input type="date" className="card" style={inputLike} />
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>Hasta</label>
                        <input type="date" className="card" style={inputLike} />
                    </div>
                </div>
            </div>

            <div className="card">
                <h2>Registro</h2>
                <div style={{ overflowX: "auto", marginTop: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#F5F5F5" }}>
                                <th style={th}>Fecha</th>
                                <th style={th}>Usuario</th>
                                <th style={th}>Tipo</th>
                                <th style={th}>Parámetros</th>
                                <th style={th}>Formato</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={tr}>
                                <td style={td}>2025-08-21 12:45</td>
                                <td style={td}>admin@empresa.com</td>
                                <td style={td}>Ventas</td>
                                <td style={td}>Producto: Shampoo; Fechas: 01–31 Ago</td>
                                <td style={tdStrong}>PDF</td>
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
