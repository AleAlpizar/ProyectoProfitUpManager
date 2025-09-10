import React from "react";
import SectionHeader from "../../../components/SectionHeader";
import { useRouter } from "next/router";

export default function FichaProducto() {
    const { query } = useRouter();
    const id = String(query.id ?? "PR-001");

    return (
        <div className="p-6">
            <SectionHeader
                title={`Ficha del producto ${id}`}

            />

            <div className="card" style={{ marginBottom: 16 }}>
                <h2>Identificación</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
                    <Info label="Código único (SKU)" value="SH500" />
                    <Info label="Nombre" value="Shampoo 500ml" />
                    <Info label="Categoría" value="Vinos Tintos" />
                    <Info label="Estado" value={<span className="badge-success">Activo</span>} />
                </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <h2>Medidas físicas</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 12 }}>
                    <Info label="Peso" value="0.55 kg" />
                    <Info label="Alto" value="18 cm" />
                    <Info label="Ancho" value="7 cm" />
                    <Info label="Largo" value="7 cm" />
                </div>
            </div>

            <div className="card">
                <h2>Características técnicas</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 12 }}>
                    <Info label="Material" value="Plástico PET" />
                    <Info label="Color" value="Transparente" />
                    <Info label="Presentación" value="Botella 500ml" />
                    <Info label="Unidad de almacenamiento" value="Unidad" />
                </div>
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="card">
            <div className="text-gray" style={{ fontSize: 12 }}>{label}</div>
            <div style={{ marginTop: 6, fontWeight: 600 }}>{value}</div>
        </div>
    );
}
