import React from "react";
import Button from "../buttons/button";
import Modal from "../modals/Modal";
import { createProvider, ProveedorCreateInput } from "./providers.api";
import { useSession } from "../hooks/useSession";
import { useConfirm } from "../modals/ConfirmProvider";

type Props = {
  onCreated?: (message?: string) => void | Promise<void>;
};

const EMPTY_FORM: ProveedorCreateInput = {
  nombre: "",
  contacto: "",
  telefono: "",
  correo: "",
  direccion: "",
};

const normalizeSpaces = (value: string) => value.replace(/\s{2,}/g, " ");
const normalizeText = (value: string) => normalizeSpaces(value).trim();
const normalizeEmail = (value: string) =>
  normalizeSpaces(value).trim().toLowerCase();
const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("+")
    ? `+${trimmed.slice(1).replace(/\D/g, "")}`
    : trimmed.replace(/\D/g, "");
};

const providerNameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9&.\-_'()/#,\s]+$/;
const contactRegex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ.\-'\s]*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9]{8,15}$/;

function validateForm(form: ProveedorCreateInput): string | null {
  const nombre = normalizeText(form.nombre);
  const contacto = normalizeText(form.contacto ?? "");
  const telefono = normalizePhone(form.telefono ?? "");
  const correo = normalizeEmail(form.correo ?? "");
  const direccion = normalizeText(form.direccion ?? "");

  if (!nombre) return "El nombre es obligatorio.";
  if (nombre.length < 2 || nombre.length > 150) {
    return "El nombre debe tener entre 2 y 150 caracteres.";
  }
  if (!providerNameRegex.test(nombre)) {
    return "El nombre contiene caracteres no permitidos.";
  }

  if (contacto) {
    if (contacto.length > 120) {
      return "El contacto no puede exceder 120 caracteres.";
    }
    if (!contactRegex.test(contacto)) {
      return "El contacto contiene caracteres no permitidos.";
    }
  }

  if (telefono && !phoneRegex.test(telefono)) {
    return "El teléfono debe contener entre 8 y 15 dígitos y solo puede incluir '+' al inicio.";
  }

  if (correo) {
    if (correo.length > 150) {
      return "El correo no puede exceder 150 caracteres.";
    }
    if (!emailRegex.test(correo)) {
      return "Correo inválido.";
    }
  }

  if (direccion.length > 300) {
    return "La dirección no puede exceder 300 caracteres.";
  }

  return null;
}

function buildPayload(form: ProveedorCreateInput): ProveedorCreateInput {
  return {
    nombre: normalizeText(form.nombre),
    contacto: normalizeText(form.contacto ?? "") || null,
    telefono: normalizePhone(form.telefono ?? "") || null,
    correo: normalizeEmail(form.correo ?? "") || null,
    direccion: normalizeText(form.direccion ?? "") || null,
  };
}

export const AddProvider: React.FC<Props> = ({ onCreated }) => {
  const [visible, setVisible] = React.useState(false);
  const [form, setForm] = React.useState<ProveedorCreateInput>(EMPTY_FORM);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { authHeader } = useSession();
  const confirm = useConfirm();

  const resetForm = React.useCallback(() => {
    setForm(EMPTY_FORM);
    setError(null);
    setLoading(false);
  }, []);

  const open = () => {
    resetForm();
    setVisible(true);
  };

  const close = () => {
    if (loading) return;
    setVisible(false);
    resetForm();
  };

  const onChange =
    (k: keyof ProveedorCreateInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let value = e.target.value;

      if (k === "nombre") {
        value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9&.\-_'()/#,\s]/g, "");
      }

      if (k === "contacto") {
        value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ.\-'\s]/g, "");
      }

      if (k === "telefono") {
        const trimmed = value.trimStart();
        value = trimmed.startsWith("+")
          ? `+${trimmed.slice(1).replace(/\D/g, "")}`
          : trimmed.replace(/\D/g, "");
      }

      setForm((f) => ({ ...f, [k]: value }));
    };

  const handleContactKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (key.length > 1) return;
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ.\-'\s]$/.test(key)) {
      e.preventDefault();
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (key.length > 1) return;
    if (!/^[0-9+]$/.test(key)) {
      e.preventDefault();
    }
    if (
      key === "+" &&
      (e.currentTarget.value.includes("+") || e.currentTarget.selectionStart !== 0)
    ) {
      e.preventDefault();
    }
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;

    setError(null);

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = buildPayload(form);

    const ok = await confirm({
      title: "Crear proveedor",
      message: (
        <>
          ¿Deseas crear el proveedor <b>{payload.nombre}</b>?
        </>
      ),
      tone: "brand",
      confirmText: "Sí, crear",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    try {
      setLoading(true);
      await createProvider(payload, authHeader as any);
      await onCreated?.("Proveedor creado correctamente.");
      setVisible(false);
      resetForm();
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
        className="!h-11 !rounded-2xl !bg-[#A30862] !px-5 !text-white hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40"
      >
        Nuevo proveedor
      </Button>

      {visible && (
        <Modal frameless onClose={close}>
          <form
            onSubmit={onSubmit}
            className="w-full max-w-5xl rounded-[28px] border border-white/10 bg-[#13171A] text-[#E6E9EA] shadow-[0_30px_80px_rgba(0,0,0,.55)] ring-1 ring-black/20"
          >
            <div className="flex items-start justify-between gap-4 px-7 pt-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#9AA8AE]">
                  Proveedores
                </div>
                <h2 className="mt-3 text-[22px] font-semibold tracking-[0.01em] text-white">
                  Crear proveedor
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#8B9AA0]">
                  Completa la información del proveedor para registrarlo en el sistema.
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-[#8B9AA0] transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                aria-label="Cerrar"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mx-7 my-5 h-px bg-white/10" />

            {error && (
              <div className="mx-7 mb-5 rounded-2xl border border-[#6C0F1C]/40 bg-[#6C0F1C]/15 px-4 py-3.5 text-sm text-[#F7C6CF]">
                {error}
              </div>
            )}

            <div className="px-7 pb-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Nombre"
                  value={form.nombre}
                  onChange={onChange("nombre")}
                  autoFocus
                  maxLength={150}
                />
                <Field
                  label="Contacto"
                  value={form.contacto ?? ""}
                  onChange={onChange("contacto")}
                  onKeyDown={handleContactKeyDown}
                  maxLength={120}
                />
                <Field
                  label="Correo"
                  type="email"
                  value={form.correo ?? ""}
                  onChange={onChange("correo")}
                  maxLength={150}
                />
                <Field
                  label="Teléfono"
                  value={form.telefono ?? ""}
                  onChange={onChange("telefono")}
                  onKeyDown={handlePhoneKeyDown}
                  maxLength={16}
                />
                <FieldArea
                  label="Dirección"
                  value={form.direccion ?? ""}
                  onChange={onChange("direccion")}
                  maxLength={300}
                />
              </div>
            </div>

            <div className="mx-7 my-6 h-px bg-white/10" />

            <div className="flex flex-col-reverse gap-3 px-7 pb-7 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={close}
                disabled={loading}
                className="!h-11 !rounded-2xl !border-white/20 !bg-transparent !px-5 !text-[#E6E9EA] hover:!bg-white/5 focus:!ring-2 focus:!ring-[#A30862]/40 disabled:!opacity-60"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="!h-11 !rounded-2xl !bg-[#A30862] !px-5 !text-white hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40 disabled:!opacity-60"
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
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  maxLength?: number;
}> = ({ label, type = "text", value, onChange, autoFocus, onKeyDown, maxLength }) => (
  <label className="space-y-1.5">
    <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#8B9AA0]">
      {label}
    </span>
    <input
      autoFocus={!!autoFocus}
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      maxLength={maxLength}
      className="h-12 w-full rounded-2xl border border-white/10 bg-[#0F1315] px-4 text-sm text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-[#8B9AA0] transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
    />
  </label>
);

const FieldArea: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength?: number;
}> = ({ label, value, onChange, maxLength }) => (
  <label className="space-y-1.5 md:col-span-2">
    <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#8B9AA0]">
      {label}
    </span>
    <textarea
      rows={4}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      className="w-full rounded-2xl border border-white/10 bg-[#0F1315] px-4 py-3 text-sm text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-[#8B9AA0] transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40 resize-none"
    />
  </label>
);

export default AddProvider;