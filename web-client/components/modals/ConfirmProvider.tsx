import React, { createContext, useContext, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

type ConfirmSize = "sm" | "md" | "lg";
type ConfirmTone = "default" | "danger" | "success" | "warning";

type ConfirmOptions = {
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  size?: ConfirmSize;
  dismissible?: boolean;
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmCtx = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<(v: boolean) => void>(() => () => {});

  const confirm: ConfirmFn = (options) =>
    new Promise<boolean>((resolve) => {
      setOpts(options || {});
      setOpen(true);
      setResolver(() => resolve);
    });

  const close = (val: boolean) => {
    setOpen(false);
    resolver(val);
  };

  const sizeClass =
    opts.size === "lg"
      ? "max-w-3xl w-[min(48rem,calc(100vw-2rem))]"
      : opts.size === "md"
      ? "max-w-xl w-[min(36rem,calc(100vw-2rem))]"
      : "max-w-md w-[min(26rem,calc(100vw-2rem))]"; 


  const tone =
    opts.tone === "danger"
      ? {
          btn: "!bg-[#5A0E2A] hover:!brightness-110", 
          ring: "focus:!ring-[#5A0E2A]/40",
          text: "text-[#EED0DA]",
        }
      : opts.tone === "success"
      ? {
          btn: "!bg-[#8E1A4B] hover:!brightness-110", 
          ring: "focus:!ring-[#8E1A4B]/40",
          text: "text-[#F2D8E2]",
        }
      : opts.tone === "warning"
      ? {
          btn: "!bg-[#B11E56] hover:!brightness-110", 
          ring: "focus:!ring-[#B11E56]/40",
          text: "text-[#F8E4EB]",
        }
      : {
          btn: "!bg-[#A30862] hover:!brightness-110", 
          ring: "focus:!ring-[#A30862]/40",
          text: "text-[#E6E9EA]",
        };

  const dismissible = opts.dismissible !== false;

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999]"
            aria-modal
            role="dialog"
            onKeyDown={(e) => {
              if (e.key === "Escape" && dismissible) close(false);
            }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => dismissible && close(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div
                className={[
                  "rounded-[1.5rem] border border-white/10 bg-[#13171A] text-[#E6E9EA]",
                  "shadow-[0_30px_80px_rgba(0,0,0,.55)] ring-1 ring-black/20",
                  "px-6 py-5",
                  sizeClass,
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-6">
                  <h3 className="text-xl font-semibold">{opts.title ?? "Confirmar"}</h3>
                  <button
                    onClick={() => close(false)}
                    className="rounded-lg px-2 py-1 text-[#8B9AA0] hover:bg-white/5"
                    aria-label="Cerrar"
                  >
                    ✕
                  </button>
                </div>

                <div className={`mt-4 text-[15px] leading-relaxed text-[#C6D0D4] ${tone.text}`}>
                  {opts.message}
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    onClick={() => close(false)}
                    className="rounded-2xl border border-white/15 bg-transparent px-4 py-2 text-[14px] text-[#E6E9EA] hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    {opts.cancelText ?? "Cancelar"}
                  </button>
                  <button
                    onClick={() => close(true)}
                    className={[
                      "rounded-2xl px-4 py-2 text-[14px] text-white focus:outline-none",
                      "focus:ring-2",
                      tone.btn,
                      tone.ring,
                    ].join(" ")}
                  >
                    {opts.confirmText ?? "Confirmar"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmCtx.Provider>
  );
}

