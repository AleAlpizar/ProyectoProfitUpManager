import React from "react";
import SectionHeader from "../../components/SectionHeader";

export default function ReporteInventarioPage() {
    return (
        <div className="p-6">
            <SectionHeader
                title="Reporte de Inventario"
                subtitle="Estado de existencias por producto y ubicación"
            />

            <div className="card" style={{ marginBottom: 16 }}>
                <h2>Filtros</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 12 }}>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>
                            Bodega <span className="badge-success">REP-004-006</span>
                        </label>
                        <select className="card" style={inputLike}>
                            <option>Central</option>
                            <option>Norte</option>
                            <option>Sur</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>
                            Producto <span className="badge-success">REP-004-007</span>
                        </label>
                        <input className="card" style={inputLike} placeholder="Ej: Vino 100ml" />
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>
                            Desde <span className="badge-success">REP-004-011</span>
                        </label>
                        <input type="date" className="card" style={inputLike} />
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>Hasta</label>
                        <input type="date" className="card" style={inputLike} />
                    </div>
                    <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                        <button className="btn btn-outline">Aplicar</button>
                        <button className="btn btn-primary">Limpiar</button>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 8 }}>
                <button className="btn btn-outline">Exportar Excel <span className="badge-success"></span></button>
                <button className="btn btn-primary">Exportar PDF <span className="badge-success"></span></button>
            </div>

            <div className="card">
                <h2>Resultados</h2>
                <div style={{ overflowX: "auto", marginTop: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#F5F5F5" }}>
                                <th style={th}>Bodega</th>
                                <th style={th}>Producto</th>
                                <th style={th}>SKU</th>
                                <th style={th}>Existencia</th>
                                <th style={th}>Última actualización</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={tr}>
                                <td style={td}>Central</td>
                                <td style={td}>Malbec Gran Cosecha 750ml</td>
                                <td style={td}>SH500</td>
                                <td style={tdStrong}>420</td>
                                <td style={td}>2025-08-21</td>
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
