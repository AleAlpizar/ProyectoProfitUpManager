import React from "react";

type Props = { title: string; subtitle?: string };

export default function SectionHeader({ title, subtitle }: Props) {
    return (
        <div style={{ marginBottom: 16 }}>
            <h1>{title}</h1>
            {subtitle && <p style={{ marginTop: 6 }}>{subtitle}</p>}
        </div>
    );
}
