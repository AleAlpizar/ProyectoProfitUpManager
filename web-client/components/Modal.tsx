import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string; 
};

export default function Modal({ open, onClose, title, children, footer, maxWidth = "max-w-lg" }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`w-full ${maxWidth} rounded-2xl bg-white p-6 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-300!">{title}</h2>
          <button onClick={onClose} className="rounded-full px-2 py-1 text-2xl leading-none hover:bg-gray-100">×</button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
}
