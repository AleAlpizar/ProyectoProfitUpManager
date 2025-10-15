import React, { useState, useMemo } from "react";
import SectionHeader from "../../components/SectionHeader";

type Vencimiento = {
  id: string;
  documento: string;
  fecha: string; 
  estado: "Vencido" | "Vigente";
  tipo: "Permiso" | "Seguro" | "Pago" | "Licencia" | "Certificado" | "Contrato";
};

const BASE: Vencimiento[] = [
  { id: "VC-01", documento: "Licencia de funcionamiento", fecha: "2025-08-10", estado: "Vencido",  tipo: "Licencia"    },
  { id: "VC-02", documento: "Contrato proveedor",         fecha: "2025-08-25", estado: "Vigente",  tipo: "Contrato"    },
  { id: "VC-03", documento: "Permiso sanitario",          fecha: "2025-09-05", estado: "Vigente",  tipo: "Permiso"     },
  { id: "VC-04", documento: "Seguro de bodega",           fecha: "2025-08-22", estado: "Vigente",  tipo: "Seguro"      },
];

const RANGO_ALERTA_DIAS = 7;

function esProximo(v: Vencimiento, hoy = new Date()) {
  const [y, m, d] = v.fecha.split("-").map(Number);
  const fechaVenc = new Date(y, (m ?? 1) - 1, d ?? 1);
  const diffDias = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return v.estado === "Vigente" && diffDias >= 0 && diffDias <= RANGO_ALERTA_DIAS;
}

export default function VencimientosPage() {
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Vencimiento | null>(null);

  const [qDoc, setQDoc] = useState("");
  const [qFecha, setQFecha] = useState("");
  const [qTipo, setQTipo] = useState("");

  const datosOrdenados = useMemo(() => {
    const base = BASE.slice()
      .filter(v =>
        (!qDoc   || v.documento.toLowerCase().includes(qDoc.trim().toLowerCase())) &&
        (!qFecha || v.fecha === qFecha) &&
        (!qTipo  || v.tipo === qTipo as Vencimiento["tipo"])
      )
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    return base;
  }, [qDoc, qFecha, qTipo]);

  const abrirNuevo = () => { setEditing(null); setOpenForm(true); };
  const abrirEditar = (v: Vencimiento) => { setEditing(v); setOpenForm(true); };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader
        title="Vencimientos"
        subtitle="Panel de alertas para la gestión de fechas de vencimiento de documentos"
      />

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white/90">Filtros</h2>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Documento</Label>
            <input
              value={qDoc}
              onChange={(e) => setQDoc(e.target.value)}
              placeholder="Ej: Permiso sanitario"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <Label>Fecha</Label>
            <input
              type="date"
              value={qFecha}
              onChange={(e) => setQFecha(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <Label>Tipo</Label>
            <select
              value={qTipo}
              onChange={(e) => setQTipo(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            >
              <option value="" className="text-black">Todos</option>
              <option value="Permiso" className="text-black">Permiso</option>
              <option value="Seguro" className="text-black">Seguro</option>
              <option value="Pago" className="text-black">Pago</option>
              <option value="Licencia" className="text-black">Licencia</option>
              <option value="Certificado" className="text-black">Certificado</option>
              <option value="Contrato" className="text-black">Contrato</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 sm:w-auto"
          >
            Buscar
          </button>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 sm:w-auto"
            onClick={() => { setQDoc(""); setQFecha(""); setQTipo(""); }}
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-white/20 sm:w-auto"
          >
            Registrar
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5">
        <div className="px-4 py-3 text-sm font-semibold text-white/90">
          Alertas de vencimiento
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-t border-white/10 text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
                <Th>Documento</Th>
                <Th>Fecha</Th>
                <Th>Estado</Th>
                <Th>Tipo</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {datosOrdenados.map((v) => {
                const proximo = esProximo(v);
                return (
                  <tr
                    key={v.id}
                    className={`hover:bg-white/5 ${proximo ? "bg-yellow-500/5" : ""}`}
                  >
                    <Td>{v.documento}</Td>
                    <Td>{v.fecha}</Td>
                    <Td>
                      {v.estado === "Vigente" ? (
                        <Badge tone={proximo ? "warn" : "success"}>
                          {proximo ? "Próximo" : "Vigente"}
                        </Badge>
                      ) : (
                        <Badge tone="danger">Vencido</Badge>
                      )}
                    </Td>
                    <Td>{v.tipo}</Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={() => abrirEditar(v)}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                      >
                        Editar
                      </button>
                    </Td>
                  </tr>
                );
              })}

              {datosOrdenados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/60">
                    No hay resultados para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs">
          <LegendItem color="bg-emerald-400/20 text-emerald-300 ring-emerald-400/30">
            Vigente
          </LegendItem>
          <LegendItem color="bg-yellow-400/20 text-yellow-300 ring-yellow-400/30">
            Próximo (≤ {RANGO_ALERTA_DIAS} días)
          </LegendItem>
          <LegendItem color="bg-red-400/20 text-red-300 ring-red-400/30">
            Vencido
          </LegendItem>
        </div>
      </section>

      {openForm && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-[0_8px_30px_rgba(0,0,0,.35)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white/90">
                {editing ? "Editar vencimiento" : "Registrar vencimiento"}
              </h2>
              <button
                type="button"
                onClick={() => setOpenForm(false)}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Documento</Label>
                <input
                  defaultValue={editing?.documento ?? ""}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                  placeholder="Ej: Licencia de funcionamiento"
                />
              </div>
              <div>
                <Label>Fecha</Label>
                <input
                  type="date"
                  defaultValue={editing?.fecha ?? ""}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <select
                  defaultValue={editing?.tipo ?? ""}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                >
                  <option value="" className="text-black">Seleccione tipo</option>
                  <option value="Permiso" className="text-black">Permiso</option>
                  <option value="Seguro" className="text-black">Seguro</option>
                  <option value="Pago" className="text-black">Pago</option>
                  <option value="Licencia" className="text-black">Licencia</option>
                  <option value="Certificado" className="text-black">Certificado</option>
                  <option value="Contrato" className="text-black">Contrato</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenForm(false)}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-white/20"
                onClick={() => setOpenForm(false)}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Label: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <label className={["mb-1 block text-xs font-medium text-white/70", className].join(" ")}>{children}</label>
);

const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <th className={["px-3 py-2 font-semibold", className].join(" ")}>{children}</th>
);

const Td: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <td className={["px-3 py-2 text-white/80", className].join(" ")}>{children}</td>
);

const Badge: React.FC<React.PropsWithChildren<{ tone?: "success" | "warn" | "danger" }>> = ({
  tone = "success",
  children,
}) => {
  const map: Record<string, string> = {
    success: "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30",
    warn:    "bg-yellow-400/20  text-yellow-300  ring-1 ring-yellow-400/30",
    danger:  "bg-red-400/20     text-red-300     ring-1 ring-red-400/30",
  };
  return (
    <span className={["inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", map[tone]].join(" ")}>
      {children}
    </span>
  );
};

const LegendItem: React.FC<React.PropsWithChildren<{ color: string }>> = ({ color, children }) => (
  <span className={["inline-flex items-center gap-2 rounded-full px-2.5 py-1 ring-1 text-xs", color].join(" ")}>
    {children}
  </span>
);

