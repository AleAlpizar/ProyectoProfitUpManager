import React from "react";
import SectionHeader from "../../components/SectionHeader";

export default function ReporteVentasPage() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader
        title="Reporte de Ventas"
        subtitle="Resumen y filtros por producto / cliente / fechas"
      />

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white/90">Filtros</h2>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <Label>
              Producto <BadgeDot />
            </Label>
            <input
              placeholder="Ej: Vino 100ml"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="md:col-span-2">
            <Label>
              Cliente <BadgeDot />
            </Label>
            <input
              placeholder="Ej: Juan Pérez"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="flex items-end gap-2 md:justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              Aplicar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              Limpiar
            </button>
          </div>

          <div>
            <Label>
              Desde <BadgeDot />
            </Label>
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
        </div>
      </section>

      <div className="mb-2 flex items-center justify-end gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          Exportar Excel <BadgeDot className="ml-2" />
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-white/20"
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
                <Th>Fecha</Th>
                <Th>Cliente</Th>
                <Th>Producto</Th>
                <Th>Cant.</Th>
                <Th>Precio</Th>
                <Th>Total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr className="hover:bg-white/5">
                <Td>2025-08-21</Td>
                <Td>Juan Pérez</Td>
                <Td>Malbec Gran Cosecha 750ml</Td>
                <Td>3</Td>
                <Td>$10.00</Td>
                <Td strong>$30.00</Td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-8 px-4 py-3 text-sm">
          <div className="text-right">
            <div className="text-white/60">Total ítems</div>
            <div className="font-semibold text-white/90">3</div>
          </div>
          <div className="text-right">
            <div className="text-white/60">Total ventas</div>
            <div className="text-emerald-300">USD 30.00</div>
          </div>
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
