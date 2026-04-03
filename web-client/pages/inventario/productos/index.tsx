import React from "react";
import Link from "next/link";

const cards = [
  {
    href: "/inventario/productos/registrar",
    ariaLabel: "Registrar producto",
    title: "Registrar producto",
    description: "Crear un nuevo artículo y registrarlo en el inventario.",
    buttonText: "Ir",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: "/inventario/existencias",
    ariaLabel: "Ver existencias",
    title: "Existencias",
    description: "Consulta y ajusta el stock por bodega.",
    buttonText: "Ver",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7.5 12 3l9 4.5M4.5 9.75V16.5L12 21l7.5-4.5V9.75M12 12l9-4.5M12 12 3 7.5"
        />
      </svg>
    ),
  },
  {
    href: "/inventario/historial/page",
    ariaLabel: "Historial de movimientos",
    title: "Historial",
    description: "Revisa entradas, salidas y ajustes.",
    buttonText: "Abrir",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 12a9 9 0 1 1-3.2-6.9"
        />
      </svg>
    ),
  },
];

export default function ProductosHomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-6">
      {/* Header principal */}
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0f1115] px-6 py-6 md:px-8 md:py-7">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#a30862]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-40 w-40 rounded-full bg-[#a30862]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(163,8,98,0.12)_0%,rgba(163,8,98,0.05)_28%,transparent_68%)]" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#a30862]/35 bg-[#1a0d16] text-[#f3a6c8] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7 12 3 4 7m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M8 5l8 4"
                  />
                </svg>
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Inventario
                </h1>
                <p className="mt-1 text-sm text-white/60 md:text-base">
                  Gestión de productos y movimientos
                </p>
              </div>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#a30862]/35 bg-[#a30862]/10 px-4 py-2 text-xs font-medium text-[#f3a6c8]">
            <span className="h-2 w-2 rounded-full bg-[#ff4da6] shadow-[0_0_12px_rgba(255,77,166,0.7)]" />
            Módulo activo
          </div>
        </div>

        <div className="relative mt-5 h-px w-full bg-gradient-to-r from-[#a30862] via-[#ff4da6]/45 to-transparent" />
      </section>

      {/* Texto secundario */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-[#14181d] px-5 py-4">
        <p className="text-sm text-white/75 md:text-base">
          Accede rápidamente a los módulos de inventario.
        </p>
      </section>

      {/* Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            aria-label={card.ariaLabel}
            className="group block focus:outline-none"
          >
            <article
              className="
                relative overflow-hidden rounded-2xl border border-white/10
                bg-[#0f1115] p-5 transition-all duration-300
                hover:-translate-y-1 hover:border-[#a30862]/40
                hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]
                focus-visible:ring-2 focus-visible:ring-[#a30862]/30
              "
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,8,98,0.14),transparent_40%)] opacity-80" />

              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-11 w-11 items-center justify-center rounded-xl
                      border border-[#a30862]/40 bg-[#1a0d16]
                      text-[#f3a6c8] transition
                      group-hover:border-[#ff4da6]
                      group-hover:bg-[#21101b]
                    "
                  >
                    {card.icon}
                  </div>

                  <h3 className="text-base font-semibold text-white">
                    {card.title}
                  </h3>
                </div>

                <p className="text-sm leading-relaxed text-white/60">
                  {card.description}
                </p>

                <div>
                  <span
                    aria-hidden="true"
                    className="
                      inline-flex items-center gap-2 rounded-xl
                      bg-[linear-gradient(180deg,#d10a7d_0%,#b0066b_100%)]
                      px-3.5 py-2 text-xs font-semibold text-white
                      shadow-[0_10px_22px_rgba(161,8,97,0.25)]
                      transition duration-300 group-hover:translate-x-0.5
                    "
                  >
                    {card.buttonText}
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14m-6-6 6 6-6 6"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}