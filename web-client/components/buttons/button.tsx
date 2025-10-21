import React from "react";

type ButtonProps = React.PropsWithChildren<{
  variant?: "primary" | "outline" | "outline-primary" | "danger" | "ghost" | "solid-emerald";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
}>;

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  disabled,
  type = "button",
  onClick,
  className = "",
  children,
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium " +
    "transition focus:outline-none focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const map: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-[#A30862] text-white hover:opacity-95 focus-visible:ring-[#A30862]/40",
    outline:
      "border bg-white text-[#111827] border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-300 " +
      "dark:border-white/20 dark:bg-transparent dark:text-[#E6E9EA] dark:hover:bg-white/5 dark:focus-visible:ring-white/20",
    "outline-primary":
      "border border-[#A30862] text-[#A30862] bg-transparent hover:bg-[#A30862]/10 focus-visible:ring-[#A30862]/30",
    danger:
 
      "bg-[#6C0F1C] text-white hover:opacity-95 focus-visible:ring-[#6C0F1C]/40",
    ghost:
      "bg-transparent text-[#111827] hover:bg-black/5 focus-visible:ring-black/10 " +
      "dark:text-[#E6E9EA] dark:hover:bg-white/5 dark:focus-visible:ring-white/20",
    "solid-emerald": "inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[base, map[variant], className].join(" ")}
    >
      {children}
    </button>
  );
};

export default Button;
