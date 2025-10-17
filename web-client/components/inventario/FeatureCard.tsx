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
  magenta: { hex: "#A30862", glow: "rgba(163,8,98,0.08)", ring: "rgba(163,8,98,0.40)" },
  lima:    { hex: "#95B64F", glow: "rgba(149,182,79,0.10)", ring: "rgba(149,182,79,0.35)" },
  vino:    { hex: "#6C0F1C", glow: "rgba(108,15,28,0.12)", ring: "rgba(108,15,28,0.40)" },
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
        group relative rounded-2xl
        border border-white/10
        bg-[#121618] text-[#E6E9EA]
        shadow-[0_20px_60px_rgba(0,0,0,.35)]
        p-5 transition
        hover:-translate-y-0.5 hover:shadow-[0_25px_70px_rgba(0,0,0,.45)]
        focus-within:outline-none
      "
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="rounded-xl p-3 transition"
          style={{
            background: glow,
            border: `1px solid ${hex}`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
          }}
        >
          <div className="text-[18px]" style={{ color: hex }}>
            {icon}
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-wide">{title}</h3>
          <p className="mt-1 text-sm text-[#8B9AA0]">{desc}</p>
        </div>
      </div>

      <div className="mt-4">
        <Link href={href} className="inline-block focus:outline-none">
          <span
            className="
              inline-flex items-center gap-2
              rounded-xl px-4 py-2 text-sm font-medium
              transition
            "
            style={{
              background: hex,
              color: "#ffffff",
              boxShadow: "0 6px 16px rgba(0,0,0,.35)",
            }}
          >
            {cta}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 transition group-hover:translate-x-0.5"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </div>

      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100"
        style={{ background: glow, filter: "blur(16px)" }}
      />

      <style jsx>{`
        .group:focus-within {
          box-shadow:
            0 20px 60px rgba(0,0,0,.45),
            0 0 0 2px ${ring};
        }
      `}</style>
    </div>
  );
};

export default FeatureCard;
