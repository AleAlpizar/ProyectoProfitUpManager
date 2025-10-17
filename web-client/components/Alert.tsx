import React from "react";

type AlertKind = "info" | "success" | "error" | "warn";

type Props = {
  type?: AlertKind;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  role?: "alert" | "status";
};

const icons: Record<AlertKind, JSX.Element> = {
  info: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v4h1" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9 9 15M9 9l6 6" />
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
};

const tone = (t: AlertKind) =>
  ({
    info:    "bg-blue-50 text-blue-800 ring-blue-200 dark:bg-white/5 dark:text-sky-200 dark:ring-sky-500/30",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-white/5 dark:text-emerald-200 dark:ring-emerald-500/30",
    error:   "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-white/5 dark:text-rose-200 dark:ring-rose-500/30",
    warn:    "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-white/5 dark:text-amber-200 dark:ring-amber-500/30",
  } as const)[t];

const accent = (t: AlertKind) =>
  ({
    info: "border-l-sky-500",
    success: "border-l-emerald-500",
    error: "border-l-rose-500",
    warn: "border-l-amber-500",
  } as const)[t];

export default function Alert({
  type = "info",
  title,
  children,
  onClose,
  className = "",
  role,
}: Props) {
  const computedRole = role ?? (type === "error" ? "alert" : "status");

  return (
    <div
      role={computedRole}
      className={[
        "relative flex gap-3 rounded-xl ring-1 px-4 py-3 border-l-4",
        tone(type),
        accent(type),
        className,
      ].join(" ")}
    >
      <div className="mt-0.5 opacity-90">{icons[type]}</div>

      <div className="min-w-0">
        {title ? <div className="font-semibold leading-5">{title}</div> : null}
        {children ? (
          <div className={title ? "mt-0.5 text-sm leading-5" : "text-sm leading-5"}>
            {children}
          </div>
        ) : null}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="ml-auto -mr-1 rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
