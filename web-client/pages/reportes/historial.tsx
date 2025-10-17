import React from "react";
import SectionHeader from "../../components/SectionHeader";

export default function HistorialReportesPage() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader
        title="Historial de reportes"
        subtitle="Consultar qué reportes se han emitido, cuándo y por quién"
      />

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white/90">Filtros</h2>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label
              htmlFor="tipo"
              className="mb-1 block text-xs font-medium text-white/70"
            >
              Tipo de reporte
            </label>
            <select
              id="tipo"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/20 focus:ring-2 focus:ring-white/20"
              defaultValue="Ventas"
            >
              <option>Ventas</option>
              <option>Inventario</option>
              <option>Órdenes de compra</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="usuario"
              className="mb-1 block text-xs font-medium text-white/70"
            >
              Usuario
            </label>
            <input
              id="usuario"
              placeholder="Ej: admin@empresa.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <label
              htmlFor="desde"
              className="mb-1 block text-xs font-medium text-white/70"
            >
              Desde
            </label>
            <input
              id="desde"
              type="date"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <label
              htmlFor="hasta"
              className="mb-1 block text-xs font-medium text-white/70"
            >
              Hasta
            </label>
            <input
              id="hasta"
              type="date"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5">
        <div className="px-4 py-3 text-sm font-semibold text-white/90">Registro</div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-t border-white/10 text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
                <Th>Fecha</Th>
                <Th>Usuario</Th>
                <Th>Tipo</Th>
                <Th>Parámetros</Th>
                <Th>Formato</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr className="hover:bg-white/5">
                <Td>2025-08-21 12:45</Td>
                <Td>admin@empresa.com</Td>
                <Td>Ventas</Td>
                <Td>Producto: Vino ; Fechas: 01–31 Ago</Td>
                <Td strong>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                    PDF
                  </span>
                </Td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <th className={["px-3 py-2 font-semibold", className].join(" ")}>{children}</th>
);

const Td: React.FC<
  React.PropsWithChildren<{ className?: string; strong?: boolean }>
> = ({ className = "", strong = false, children }) => (
  <td
    className={[
      "px-3 py-2",
      strong ? "font-semibold text-white/90" : "text-white/80",
      className,
    ].join(" ")}
  >
    {children}
  </td>
);
