const Button: React.FC<
  React.PropsWithChildren<{
    variant?: "primary" | "outline" | "outline-primary" | "danger" | "ghost";
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
    className?: string;
  }>
> = ({ variant = "primary", disabled, type = "button", onClick, className = "", children }) => {
  const base = "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2";
  const map: Record<string, string> = {
    primary: "bg-primary! text-white! shadow-sm! hover:opacity-90! focus:ring-primary/30!",
    outline: "border! border-gray-300! bg-white! text-secondary! hover:bg-gray-50! focus:ring-primary/10!",
    "outline-primary": "border! border-primary! text-primary! bg-transparent! hover:bg-primary/5! focus:ring-primary/30!",
    danger: "bg-danger! text-white! shadow-sm! hover:opacity-90! focus:ring-danger/30!",
    ghost: "text-secondary! hover:bg-gray-100! focus:ring-primary/10!",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        base,
        map[variant],
        disabled ? "cursor-not-allowed opacity-60" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
};


export default Button;