import React from "react";

export const CardTable: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121618] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
    <table className="min-w-full border-collapse">{children}</table>
  </div>
);

export const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <th
    className={[
      "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8B9AA0]",
      className,
    ].join(" ")}
  >
    {children}
  </th>
);

type TdProps = React.PropsWithChildren<
  {
    className?: string;
    strong?: boolean;
  } & React.TdHTMLAttributes<HTMLTableCellElement>
>;
export const Td: React.FC<TdProps> = ({ className = "", strong = false, children, ...rest }) => (
  <td
    className={[
      "px-3 py-3 text-sm",
      strong ? "font-semibold text-white" : "text-[#E6E9EA]",
      className,
    ].join(" ")}
    {...rest}
  >
    {children}
  </td>
);

export const PageBtn: React.FC<
  React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>
> = ({ className = "", children, ...props }) => (
  <button
    className={[
      "rounded-xl px-3 py-1 text-sm transition",
      "bg-[#1C2224] text-white hover:bg-white/10",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "focus:outline-none focus:ring-2 focus:ring-[#A30862]/40",
      className,
    ].join(" ")}
    {...props}
  >
    {children}
  </button>
);

export const SELECT_CLS =
  "h-8 w-40 shrink-0 rounded-lg border border-white/10 bg-[#1C2224] px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#A30862]/40";

export const PillBadge: React.FC<React.PropsWithChildren<{ variant?: "success" | "danger" | "warning" | "default" }>> = ({
  variant = "default",
  children,
}) => {
  const map: Record<string, string> = {
    success: "border-lime-400/40 text-lime-300 bg-lime-400/5",
    danger: "border-rose-400/40 text-rose-300 bg-rose-400/5",
    warning: "border-amber-400/40 text-amber-300 bg-amber-400/5",
    default: "border-white/15 text-[#8B9AA0] bg-white/5",
  };
  return (
    <span
      className={[
        "inline-flex h-7 items-center justify-center rounded-full px-3",
        "text-xs font-medium whitespace-nowrap border",
        map[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
};

export const StatusPill: React.FC<{ status: "ACTIVE" | "PAUSED" | "VACATION" }> = ({ status }) => {
  const label: Record<"ACTIVE" | "PAUSED" | "VACATION", string> = {
    ACTIVE: "Activo",
    PAUSED: "Inactivo",
    VACATION: "Vacaciones",
  };
  const variant: Record<"ACTIVE" | "PAUSED" | "VACATION", "success" | "danger" | "warning"> = {
    ACTIVE: "success",
    PAUSED: "danger",
    VACATION: "warning",
  };
  return <PillBadge variant={variant[status]}>{label[status]}</PillBadge>;
};
