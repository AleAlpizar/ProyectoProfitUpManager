import type { NextPage } from "next";
import Link from "next/link";

import { CustomersIcon } from "../../components/icons/sidebar/customers-icon";
import { PaymentsIcon } from "../../components/icons/sidebar/payments-icon";
import { ProductsIcon } from "../../components/icons/sidebar/products-icon";

const ReportesIndexPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#E6E9EA] p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-wide">
          Centro de reportes
        </h1>
        <p className="text-sm text-[#8B9AA0]">
          Elige el tipo de reporte que quieres analizar. Aquí aparecerán los
          reportes que se vayan creando.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/reportes/clientes" legacyBehavior>
          <a className="group flex min-h-[170px] flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-[#171821] to-[#0B0F0E] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)] transition hover:border-[#E11D74]/60 hover:shadow-[0_22px_55px_rgba(0,0,0,0.7)]">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[#E11D74]/50 bg-[#E11D74]/10">
                <CustomersIcon />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-wide text-[#F9FAFB]">
                  Reporte de clientes
                </h2>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Compras mensuales, ranking de clientes, inactivos y detalle de
                  ventas por cliente.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#E11D74] px-4 py-1.5 text-xs font-semibold text-white shadow-md transition group-hover:bg-[#F973AF]">
                Ir a reporte de clientes
                <span className="text-sm">→</span>
              </span>
            </div>
          </a>
        </Link>

        <Link href="/reportes/ventas" legacyBehavior>
          <a className="group flex min-h-[170px] flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-[#171821] to-[#0B0F0E] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)] transition hover:border-emerald-400/60 hover:shadow-[0_22px_55px_rgba(0,0,0,0.7)]">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10">
                <PaymentsIcon />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-wide text-[#F9FAFB]">
                  Reporte de ventas
                </h2>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Análisis de ventas por día, por bodega, por producto y
                  márgenes.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition group-hover:bg-emerald-400">
                Ir a reporte de ventas
                <span className="text-sm">→</span>
              </span>
            </div>
          </a>
        </Link>

        <Link href="/reportes/inventario" legacyBehavior>
          <a className="group flex min-h-[170px] flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-[#171821] to-[#0B0F0E] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)] transition hover:border-[#B1005F]/60 hover:shadow-[0_22px_55px_rgba(0,0,0,0.7)]">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[#B1005F]/50 bg-[#B1005F]/10">
                <ProductsIcon />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-wide text-[#F9FAFB]">
                  Reporte de inventario
                </h2>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Stock por bodega y producto, quiebres, sobrestock, rotación y
                  movimientos de inventario.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#B1005F] px-4 py-1.5 text-xs font-semibold text-white shadow-md transition group-hover:bg-[#E11D74]">
                Ir a reporte de inventario
                <span className="text-sm">→</span>
              </span>
            </div>
          </a>
        </Link>
      </section>
    </div>
  );
};

export default ReportesIndexPage;
