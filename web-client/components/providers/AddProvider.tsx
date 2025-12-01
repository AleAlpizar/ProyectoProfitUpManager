
import React from "react";
import Button from "../buttons/button";
import Modal from "../modals/Modal";
import { createProvider, ProveedorCreateInput } from "./providers.api";
import { useSession } from "../hooks/useSession";
import { useConfirm } from "../modals/ConfirmProvider";

type Props = {
  onCreated?: () => void;
};

export const AddProvider: React.FC<Props> = ({ onCreated }) => {
  const [visible, setVisible] = React.useState(false);
  const [form, setForm] = React.useState<ProveedorCreateInput>({
    nombre: "",
    contacto: "",
    telefono: "",
    correo: "",
    direccion: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { authHeader } = useSession();
  const confirm = useConfirm();

  const open = () => setVisible(true);
  const close = () => {
    setVisible(false);
    setError(null);
    setLoading(false);
  };

  const onChange =
    (k: keyof ProveedorCreateInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let value = e.target.value;

      if (k === "nombre" || k === "contacto") {
        value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]/g, "");
      }

      if (k === "telefono") {
        value = value.replace(/\D/g, "");
      }

      setForm((f) => ({ ...f, [k]: value }));
    };

  const handleLettersKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    if (key.length > 1) return;

    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]$/;
    if (!regex.test(key)) {
      e.preventDefault();
    }
  };

  const handleNumbersKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    if (key.length > 1) return;

    const regex = /^[0-9]$/;
    if (!regex.test(key)) {
      e.preventDefault();
    }
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (form.correo && !form.correo.includes("@"))
      return setError("Correo inválido.");

    const ok = await confirm({
      title: "Crear proveedor",
      message: (
        <>
          ¿Deseas crear el proveedor <b>{form.nombre}</b>?
        </>
      ),
      tone: "brand",
      confirmText: "Sí, crear",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    try {
      setLoading(true);
      await createProvider(form, authHeader as any);
      onCreated?.();
      close();
    } catch (err: any) {
      setError(err?.message || "No se pudo crear el proveedor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={open}
        className="!rounded-xl !bg-[#A30862] !text-white hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40"
      >
        Nuevo proveedor
      </Button>

      {visible && (
        <Modal frameless onClose={close}>
          <form
            onSubmit={onSubmit}
            className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[#13171A] text-[#E6E9EA] shadow-[0_30px_80px_rgba(0,0,0,.55)] ring-1 ring-black/20"
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-[#8B9AA0]">
                  Proveedores
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-wide">
                  Crear proveedor
                </h2>
                <p className="mt-1 text-sm text-[#8B9AA0]">
                  Completa los datos para registrar un nuevo proveedor.
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                className="rounded-xl p-2 text-[#8B9AA0] hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Cerrar"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mx-6 my-4 h-px bg-white/10" />

            {error && (
              <div className="mx-6 mb-4 rounded-2xl border border-[#6C0F1C]/40 bg-[#6C0F1C]/15 px-4 py-3 text-sm text-[#F7C6CF]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 px-6 pb-2 md:grid-cols-2">
              <Field
                label="Nombre"
                value={form.nombre}
                onChange={onChange("nombre")}
                onKeyDown={handleLettersKeyDown}
                autoFocus
              />
              <Field
                label="Contacto"
                value={form.contacto ?? ""}
                onChange={onChange("contacto")}
                onKeyDown={handleLettersKeyDown}
              />
              <Field
                label="Correo"
                type="email"
                value={form.correo ?? ""}
                onChange={onChange("correo")}
              />
              <Field
                label="Teléfono"
                value={form.telefono ?? ""}
                onChange={onChange("telefono")}
                onKeyDown={handleNumbersKeyDown}
              />
              <FieldArea
                label="Dirección"
                value={form.direccion ?? ""}
                onChange={onChange("direccion")}
              />
            </div>

            <div className="mx-6 my-6 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={close}
                className="!rounded-2xl !border-white/20 !bg-transparent !text-[#E6E9EA] hover:!bg-white/5 focus:!ring-2 focus:!ring-[#A30862]/40"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="!rounded-2xl !bg-[#A30862] !text-white hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40 disabled:!opacity-60"
              >
                {loading ? "Guardando..." : "Guardar proveedor"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Field: React.FC<{
  label: string;
  type?: React.HTMLInputTypeAttribute;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}> = ({ label, type = "text", value, onChange, autoFocus, onKeyDown }) => (
  <label className="space-y-1">
    <span className="text-xs text-[#8B9AA0]">{label}</span>
    <input
      autoFocus={!!autoFocus}
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className="w-full rounded-2xl border border-white/10 bg-[#0F1315] px-3 py-2.5 text-sm outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-[#8B9AA0] transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
    />
  </label>
);

const FieldArea: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}> = ({ label, value, onChange }) => (
  <label className="space-y-1 md:col-span-2">
    <span className="text-xs text-[#8B9AA0]">{label}</span>
    <textarea
      rows={3}
      value={value}
      onChange={onChange}
      className="w-full rounded-2xl border border-white/10 bg-[#0F1315] px-3 py-2.5 text-sm outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-[#8B9AA0] transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40 resize-none"
    />
  </label>
);

export default AddProvider;
