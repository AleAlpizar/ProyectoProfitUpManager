import React from "react";

type Props = {
    open: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
};

export default function ConfirmDialog({
    open,
    title,
    message,
    onClose,
    onConfirm,
    confirmText = "Confirmar",
}: Props) {
    if (!open) return null;

    return (
        <div
            className="modal-overlay"
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{ width: "100%", maxWidth: 520 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2>{title}</h2>
                <p style={{ marginTop: 8 }}>{message}</p>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                    <button className="btn btn-outline" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            onConfirm?.();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
