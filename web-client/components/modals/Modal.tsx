import React from "react";
import { createPortal } from "react-dom";

type Props = {
  children: React.ReactNode;
  onClose: () => void;
  frameless?: boolean;
  className?: string;
  zIndex?: number;
};

const Modal: React.FC<Props> = ({
  children,
  onClose,
  frameless = false,
  className = "",
  zIndex = 9000,
}) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex }}>
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden
      />

      <div className="absolute inset-0 p-4 pointer-events-none flex items-center justify-center">
        {frameless ? (
          <div className="w-full flex justify-center pointer-events-auto">
            {children}
          </div>
        ) : (
          <div
            className={[
              "pointer-events-auto w-full max-w-3xl rounded-3xl border border-white/10",
              "bg-[#121618] text-[#E6E9EA] shadow-[0_30px_80px_rgba(0,0,0,.55)]",
              "ring-1 ring-black/20",
              className,
            ].join(" ")}
            role="dialog"
            aria-modal="true"
          >
            {children}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
