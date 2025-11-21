import React, { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";

export type ConfirmTone = "default" | "brand" | "danger" | "warning";
export type ConfirmSize = "sm" | "md" | "lg" | "xl";

export type ConfirmOptions = {
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  size?: ConfirmSize;
};

type State =
  | (ConfirmOptions & {
      open: boolean;
      resolve?: (v: boolean) => void;
    })
  | null;

const Ctx = createContext<(opts: ConfirmOptions) => Promise<boolean>>(
  () => Promise.resolve(false)
);

export function useConfirm() {
  return useContext(Ctx);
}

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<State>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, ...opts, resolve });
    });
  }, []);

  const close = (value: boolean) => {
    state?.resolve?.(value);
    setState(null);
  };

  const tone = state?.tone ?? "default";
  const size = state?.size ?? "md";

  const toneClasses: Record<ConfirmTone, { btn: string; ring: string }> = {
    default: {
      btn: "bg-[#A30862] hover:opacity-95 text-white",
      ring: "focus:ring-[#A30862]/40",
    },
    brand: {
      btn: "bg-[#A30862] hover:opacity-95 text-white",
      ring: "focus:ring-[#A30862]/40",
    },
    danger: {
      btn: "bg-[#A30862] hover:opacity-95 text-white",
      ring: "focus:ring-[#A30862]/40",
    },
    warning: {
      btn: "bg-[#A30862] hover:opacity-95 text-white",
      ring: "focus:ring-[#A30862]/40",
    },
  };

  const sizeClasses: Record<ConfirmSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  const confirmUI =
    state?.open &&
    createPortal(
      <div className="fixed inset-0 z-[10000]">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => close(false)}
        />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className={[
              "w-full rounded-2xl border border-white/10 bg-[#121618] text-[#E6E9EA]",
              "shadow-[0_25px_80px_rgba(0,0,0,0.55)]",
              sizeClasses[size],
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5">
              <h2 className="text-lg font-semibold">
                {state.title ?? "Confirmación"}
              </h2>
              <button
                className="rounded-lg p-2 text-[#8B9AA0] hover:bg-white/5"
                onClick={() => close(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {state.message && (
              <div className="px-6 pt-3 text-sm text-[#C8D0D3]">
                {state.message}
              </div>
            )}

            <div className="px-6 pb-5 pt-6 flex justify-end gap-2">
              <button
                className="rounded-xl border border-white/20 bg-transparent px-4 py-2 text-sm text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30"
                onClick={() => close(false)}
              >
                {state.cancelText ?? "Cancelar"}
              </button>

              <button
                className={[
                  "rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2",
                  toneClasses[tone].btn,
                  toneClasses[tone].ring,
                ].join(" ")}
                onClick={() => close(true)}
              >
                {state.confirmText ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {confirmUI}
    </Ctx.Provider>
  );
};
