import React from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean; 
};


export default function ConfirmDialog({
  open,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  destructive = false,
}: ConfirmDialogProps) {
  const confirmRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => confirmRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4"
      onClick={onClose}
      aria-hidden="false"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="
          w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-2xl
          outline-none text-white
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="confirm-title" className="text-lg font-semibold leading-6">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div id="confirm-desc" className="text-sm text-white/80">
          {message}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="
              inline-flex items-center justify-center rounded-lg
              border border-white/10 bg-transparent px-4 py-2 text-sm font-medium
              text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20
            "
          >
            {cancelText}
          </button>

          <button
            type="button"
            ref={confirmRef}
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className={[
              "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-white/20 transition",
              destructive
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white",
            ].join(" ")}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
