import React from "react";
import Link from "next/link";

export type FeatureCardProps = {
  title: string;
  desc: string;
  href: string;
  cta: string;
  icon: React.ReactNode;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ title, desc, href, cta, icon }) => {
  return (
    <div
      className="
        group relative rounded-2xl
        bg-white/5 dark:bg-white/5
        border border-black/5 dark:border-white/10
        shadow-sm backdrop-blur
        p-5
        transition
        hover:-translate-y-0.5 hover:shadow-lg
        hover:bg-white/10
        focus-within:ring-2 focus-within:ring-emerald-400/60
      "
    >
      <div className="flex items-start gap-4">
        <div
          className="rounded-xl p-3 bg-emerald-500/10 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/15"
          aria-hidden
        >
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{desc}</p>
        </div>
      </div>

      <div className="mt-4">
        <Link href={href}>
          <span
            className="
              inline-flex items-center gap-2
              rounded-xl px-4 py-2 text-sm font-medium
              bg-emerald-600 text-white
              hover:bg-emerald-700
              focus:outline-none focus:ring-2 focus:ring-emerald-400/60
              transition
            "
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

      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition">
        <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 blur-xl" />
      </div>
    </div>
  );
};

export default FeatureCard;
