import type { NextPage } from "next";
import Link from "next/link";

import { CustomersIcon } from "../../components/icons/sidebar/customers-icon";
import { PaymentsIcon } from "../../components/icons/sidebar/payments-icon";
import { ProductsIcon } from "../../components/icons/sidebar/products-icon";

const cardBaseClass =
  "group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(23,24,33,0.96),rgba(11,15,14,0.98))] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.42)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_26px_70px_rgba(0,0,0,0.55)]";

const ReportesIndexPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#E6E9EA]">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(225,29,116,0.08),transparent_28%),linear-gradient(180deg,rgba(16,21,26,0.94),rgba(11,15,14,0.98))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.38)] md:p-8">
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center rounded-full border border-[#E11D74]/25 bg-[#E11D74]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#F9A8D4]">
                Centro de análisis
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-wide text-[#F9FAFB] md:text-4xl">
                  Centro de reportes
                </h1>
                <p className="mt-2 text-sm leading-6 text-[#8B9AA0] md:text-[15px]">
                  Elige el tipo de reporte que quieres analizar. Aquí aparecerán
                  los reportes disponibles para revisar información clave del
                  sistema de forma clara y ordenada.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 self-start md:self-auto">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wide text-[#7F8B91]">
                  Módulos
                </p>
                <p className="mt-1 text-lg font-semibold text-[#F9FAFB]">3</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wide text-[#7F8B91]">
                  Estado
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-400">
                  Activo
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wide text-[#7F8B91]">
                  Vista
                </p>
                <p className="mt-1 text-lg font-semibold text-[#F9FAFB]">
                  General
                </p>
              </div>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Link href="/reportes/clientes" legacyBehavior>
              <a className={cardBaseClass}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,29,116,0.14),transparent_30%)] opacity-80" />

                <div className="relative flex min-h-[210px] flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#E11D74]/50 bg-[#E11D74]/10 shadow-[0_10px_30px_rgba(225,29,116,0.18)]">
                        <CustomersIcon />
                      </div>

                      <div className="min-w-0">
                        <div className="inline-flex rounded-full border border-[#E11D74]/20 bg-[#E11D74]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#F9A8D4]">
                          Clientes
                        </div>
                        <h2 className="mt-3 text-lg font-semibold tracking-wide text-[#F9FAFB]">
                          Reporte de clientes
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                          Compras mensuales, ranking de clientes, clientes
                          inactivos y detalle de ventas por cliente.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#B5BDC2]">
                        Compras
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#B5BDC2]">
                        Ranking
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#B5BDC2]">
                        Inactivos
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#E11D74] px-4 py-2 text-xs font-semibold text-white shadow-md transition group-hover:bg-[#F973AF]">
                      Ir a reporte
                      <span className="text-sm transition group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>

                    <span className="text-[11px] uppercase tracking-wide text-[#7F8B91]">
                      Disponible
                    </span>
                  </div>
                </div>
              </a>
            </Link>

            <Link href="/reportes/ventas" legacyBehavior>
              <a className={cardBaseClass}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_30%)] opacity-80" />

                <div className="relative flex min-h-[210px] flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 shadow-[0_10px_30px_rgba(16,185,129,0.18)]">
                        <PaymentsIcon />
                      </div>

                      <div className="min-w-0">
                        <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                          Ventas
                        </div>
                        <h2 className="mt-3 text-lg font-semibold tracking-wide text-[#F9FAFB]">
                          Reporte de ventas
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                          Análisis de ventas por día, por bodega, por producto y
                          revisión de márgenes comerciales.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#B5BDC2]">
                        Diarias
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#B5BDC2]">
                        Bodega
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#B5BDC2]">
                        Márgenes
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition group-hover:bg-emerald-400">
                      Ir a reporte
                      <span className="text-sm transition group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>

                    <span className="text-[11px] uppercase tracking-wide text-[#7F8B91]">
                      Disponible
                    </span>
                  </div>
                </div>
              </a>
            </Link>

            <Link href="/reportes/inventario" legacyBehavior>
              <a className={cardBaseClass}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(177,0,95,0.16),transparent_30%)] opacity-80" />

                <div className="relative flex min-h-[210px] flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#B1005F]/50 bg-[#B1005F]/10 shadow-[0_10px_30px_rgba(177,0,95,0.18)]">
                        <ProductsIcon />
                      </div>

                      <div className="min-w-0">
                        <div className="inline-flex rounded-full border border-[#B1005F]/20 bg-[#B1005F]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#F9A8D4]">
                          Inventario
                        </div>
                        <h2 className="mt-3 text-lg font-semibold tracking-wide text-[#F9FAFB]">
                          Reporte de inventario
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                          Stock por bodega y producto, quiebres, sobrestock,
                          rotación y movimientos de inventario.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#B5BDC2]">
                        Stock
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#B5BDC2]">
                        Rotación
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#B5BDC2]">
                        Kardex
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#B1005F] px-4 py-2 text-xs font-semibold text-white shadow-md transition group-hover:bg-[#E11D74]">
                      Ir a reporte
                      <span className="text-sm transition group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>

                    <span className="text-[11px] uppercase tracking-wide text-[#7F8B91]">
                      Disponible
                    </span>
                  </div>
                </div>
              </a>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReportesIndexPage;