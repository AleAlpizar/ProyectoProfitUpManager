import React from "react";
import Link from "next/link";

export type FeatureCardProps = {
  title: string;
  desc: string;
  href: string;
  cta: string;
  icon: React.ReactNode;
  color?: "magenta" | "lima" | "vino";
};

const PALETTE = {
  magenta: {
    hex: "#A30862",
    glow: "rgba(163,8,98,0.08)",
    ring: "rgba(163,8,98,0.40)",
  },
  lima: {
    hex: "#95B64F",
    glow: "rgba(149,182,79,0.10)",
    ring: "rgba(149,182,79,0.35)",
  },
  vino: {
    hex: "#6C0F1C",
    glow: "rgba(108,15,28,0.12)",
    ring: "rgba(108,15,28,0.40)",
  },
} as const;

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  desc,
  href,
  cta,
  icon,
  color = "magenta",
}) => {
  const { hex, glow, ring } = PALETTE[color];

  return (
    <div
      className="
        group relative flex h-full flex-col justify-between rounded-3xl
        border border-white/10
        bg-[#121618] text-[#E6E9EA]
        p-6 shadow-[0_20px_60px_rgba(0,0,0,.35)]
        transition duration-300
        hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_28px_75px_rgba(0,0,0,.45)]
        focus-within:outline-none
      "
    >
      <div>
        <div className="flex items-start gap-4">
          <div
            aria-hidden
            className="rounded-2xl p-3.5 transition duration-300"
            style={{
              background: glow,
              border: `1px solid ${hex}`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
            }}
          >
            <div className="text-[20px]" style={{ color: hex }}>
              {icon}
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-wide text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#8B9AA0]">{desc}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link href={href} className="inline-block focus:outline-none">
          <span
            className="
              inline-flex items-center gap-2
              rounded-xl px-4 py-2.5 text-sm font-semibold
              transition duration-300
            "
            style={{
              background: hex,
              color: "#ffffff",
              boxShadow: "0 8px 20px rgba(0,0,0,.35)",
            }}
          >
            {cta}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 transition duration-300 group-hover:translate-x-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </div>

      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: glow, filter: "blur(18px)" }}
      />

      <style jsx>{`
        .group:focus-within {
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.45),
            0 0 0 2px ${ring};
        }
      `}</style>
    </div>
  );
};

export default FeatureCard;