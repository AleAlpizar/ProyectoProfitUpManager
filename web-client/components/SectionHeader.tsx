"use client";
import React from "react";

export default function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-2 md:mb-3">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
    </div>
  );
}
