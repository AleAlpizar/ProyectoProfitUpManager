import React from "react";
import SectionHeader from "../../components/SectionHeader";

export default function ReporteOrdenesPage() {
    return (
        <div className="p-6">
            <SectionHeader
                title="Reporte de Órdenes de Compra"
                subtitle="Historial de solicitudes a proveedores"
            />

            <div className="card" style={{ marginBottom: 16 }}>
                <h2>Filtros</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginTop: 12 }}>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>
                            Producto <span className="badge-success"></span>
                        </label>
                        <input className="card" style={inputLike} placeholder="Ej: Shampoo 500ml" />
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>
                            Estado <span className="badge-success"></span>
                        </label>
                        <select className="card" style={inputLike}>
                            <option>Pendiente</option>
                            <option>Completado</option>
                            <option>Cancelado</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>
                            Cliente  <span className="badge-success"></span>
                        </label>
                        <input className="card" style={inputLike} placeholder="Ej: Empresa X" />
                    </div>
                    <div>
                        <label className="text-gray" style={{ fontSize: 12 }}>
                            Desde <span className="badge-success"></span>
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
                                <th style={th}># Orden</th>
                                <th style={th}>Proveedor</th>
                                <th style={th}>Producto</th>
                                <th style={th}>Cant.</th>
                                <th style={th}>Estado</th>
                                <th style={th}>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={tr}>
                                <td style={tdStrong}>OC-0001</td>
                                <td style={td}>Proveedor A</td>
                                <td style={td}>Malbec Gran Cosecha 750ml</td>
                                <td style={td}>120</td>
                                <td style={td}><span className="badge-success">Pendiente</span></td>
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
