export default function Alert({ type="info", children }:{type?: "info"|"success"|"error"|"warn", children: React.ReactNode}) {
  const tones = {
    info:    "bg-blue-50 text-blue-700 ring-blue-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    error:   "bg-red-50 text-red-700 ring-red-200",
    warn:    "bg-yellow-50 text-yellow-800 ring-yellow-200",
  } as const;
  return <div className={`rounded-xl ring-1 px-3 py-2 ${tones[type]}`}>{children}</div>;
}
