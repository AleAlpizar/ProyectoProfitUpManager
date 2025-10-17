import React from "react";
import SectionHeader from "../../components/SectionHeader";

export default function ReporteOrdenesPage() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader
        title="Reporte de Órdenes de Compra"
        subtitle="Historial de solicitudes a proveedores"
      />

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white/90">Filtros</h2>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <Label>Producto <BadgeDot /></Label>
            <input
              placeholder="Ej: Vino 100ml"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <Label>Estado <BadgeDot /></Label>
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
              defaultValue="Pendiente"
            >
              <option>Pendiente</option>
              <option>Completado</option>
              <option>Cancelado</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <Label>Cliente <BadgeDot /></Label>
            <input
              placeholder="Ej: Empresa X"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <Label>Desde <BadgeDot /></Label>
            <input
              type="date"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <Label>Hasta</Label>
            <input
              type="date"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="flex items-end gap-2 md:col-span-2">
            <button
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              type="button"
            >
              Aplicar
            </button>
            <button
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-white/20"
              type="button"
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      <div className="mb-2 flex items-center justify-end gap-2">
        <button
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
          type="button"
        >
          Exportar Excel <BadgeDot className="ml-2" />
        </button>
        <button
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-white/20"
          type="button"
        >
          Exportar PDF <BadgeDot className="ml-2" />
        </button>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5">
        <div className="px-4 py-3 text-sm font-semibold text-white/90">
          Resultados
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-t border-white/10 text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
                <Th># Orden</Th>
                <Th>Proveedor</Th>
                <Th>Producto</Th>
                <Th>Cant.</Th>
                <Th>Estado</Th>
                <Th>Fecha</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr className="hover:bg-white/5">
                <Td strong>OC-0001</Td>
                <Td>Proveedor A</Td>
                <Td>Malbec Gran Cosecha 750ml</Td>
                <Td>120</Td>
                <Td>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                    Pendiente
                  </span>
                </Td>
                <Td>2025-08-21</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const Label: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <label className={["mb-1 block text-xs font-medium text-white/70", className].join(" ")}>{children}</label>
);

const BadgeDot: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span className={["inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle", className].join(" ")} />
);

const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <th className={["px-3 py-2 font-semibold", className].join(" ")}>{children}</th>
);

const Td: React.FC<React.PropsWithChildren<{ className?: string; strong?: boolean }>> = ({
  className = "",
  strong = false,
  children,
}) => (
  <td className={["px-3 py-2", strong ? "font-semibold text-white/90" : "text-white/80", className].join(" ")}>
    {children}
  </td>
);
