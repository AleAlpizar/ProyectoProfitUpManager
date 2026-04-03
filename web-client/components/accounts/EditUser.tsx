import React from "react";
import Modal from "../modals/Modal";
import Button from "../buttons/button";
import { Role, UpdateUserInput, updateUser } from "./accounts.api";
import { useSession } from "../hooks/useSession";
import { useConfirm } from "../modals/ConfirmProvider";

type Props = {
  user: {
    usuarioId: number;
    nombre: string;
    apellido?: string;
    correo: string;
    telefono?: string | null;
    rol: Role;
    isCurrentUser?: boolean;
  };
  onSaved?: () => void | Promise<void>;
  onClose?: () => void;
};

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ'\-\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeName(value: string) {
  return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ'\-\s]/g, "");
}

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function validateForm(form: UpdateUserInput): string | null {
  const nombre = normalizeSpaces(form.nombre || "");
  const apellido = normalizeSpaces(form.apellido || "");
  const correo = (form.correo || "").trim().toLowerCase();
  const telefono = sanitizePhone(form.telefono || "");

  if (!nombre) return "El nombre es obligatorio.";
  if (nombre.length < 2) return "El nombre debe tener al menos 2 caracteres.";
  if (nombre.length > 100) return "El nombre no puede exceder 100 caracteres.";
  if (!NAME_REGEX.test(nombre)) return "El nombre contiene caracteres no permitidos.";

  if (apellido) {
    if (apellido.length < 2) return "El apellido debe tener al menos 2 caracteres.";
    if (apellido.length > 100) return "El apellido no puede exceder 100 caracteres.";
    if (!NAME_REGEX.test(apellido)) return "El apellido contiene caracteres no permitidos.";
  }

  if (!correo) return "El correo es obligatorio.";
  if (correo.length > 256) return "El correo no puede exceder 256 caracteres.";
  if (!EMAIL_REGEX.test(correo)) return "Correo inválido.";

  if (telefono && (telefono.length < 8 || telefono.length > 20)) {
    return "El teléfono debe tener entre 8 y 20 dígitos.";
  }

  return null;
}

export const EditUser: React.FC<Props> = ({ user, onSaved, onClose }) => {
  const { authHeader } = useSession();
  const confirm = useConfirm();

  const [form, setForm] = React.useState<UpdateUserInput>({
    nombre: user.nombre,
    apellido: user.apellido ?? "",
    correo: user.correo,
    telefono: user.telefono ?? "",
    rol: user.rol ?? "Empleado",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setForm({
      nombre: user.nombre,
      apellido: user.apellido ?? "",
      correo: user.correo,
      telefono: user.telefono ?? "",
      rol: user.rol ?? "Empleado",
    });
    setError(null);
  }, [user]);

  const onChange =
    (k: keyof UpdateUserInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let value = e.target.value;

      if (k === "nombre" || k === "apellido") {
        value = sanitizeName(value);
      }

      if (k === "telefono") {
        value = sanitizePhone(value);
      }

      if (k === "correo") {
        value = value.trimStart();
      }

      setForm((f) => ({ ...f, [k]: value }));
    };

  const handleLettersKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (key.length > 1) return;

    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ'\-\s]$/;
    if (!regex.test(key)) {
      e.preventDefault();
    }
  };

  const handleNumbersKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (key.length > 1) return;

    const regex = /^[0-9]$/;
    if (!regex.test(key)) {
      e.preventDefault();
    }
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    const normalized: UpdateUserInput = {
      nombre: normalizeSpaces(form.nombre || ""),
      apellido: normalizeSpaces(form.apellido || ""),
      correo: (form.correo || "").trim().toLowerCase(),
      telefono: sanitizePhone(form.telefono || ""),
      rol: user.isCurrentUser ? undefined : form.rol,
    };

    const validationError = validateForm(normalized);
    if (validationError) {
      setError(validationError);
      return;
    }

    const ok = await confirm({
      title: "Guardar cambios",
      message: (
        <>
          ¿Deseas guardar los cambios del usuario <b>{normalized.nombre}</b>?
        </>
      ),
      tone: "brand",
      confirmText: "Sí, guardar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    try {
      setLoading(true);

      const payload: UpdateUserInput = {
        ...normalized,
        apellido: normalized.apellido || undefined,
        telefono: normalized.telefono || null,
      };

      await updateUser(user.usuarioId, payload, authHeader as Record<string, string>);
      await onSaved?.();
      onClose?.();
    } catch (err: any) {
      setError(err?.message || "No se pudo actualizar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal frameless onClose={() => !loading && onClose?.()}>
      <form
        onSubmit={submit}
        className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#13171A] text-[#E6E9EA] shadow-[0_30px_90px_rgba(0,0,0,.55)] ring-1 ring-black/20"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#8B9AA0]">
              Usuarios
            </div>
            <h2 className="mt-3 text-[22px] font-semibold tracking-wide text-white">
              Editar usuario
            </h2>
            <p className="mt-1 text-sm text-[#8B9AA0]">
              Actualiza los datos del usuario.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            disabled={loading}
            className="rounded-2xl p-2.5 text-[#8B9AA0] transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mx-6 my-5 h-px bg-white/10" />

        {error && (
          <div className="mx-6 mb-5 rounded-2xl border border-[#6C0F1C]/40 bg-[#6C0F1C]/15 px-4 py-3 text-sm text-[#F7C6CF]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 px-6 pb-2 md:grid-cols-2">
          <Field
            label="Nombre"
            value={form.nombre ?? ""}
            onChange={onChange("nombre")}
            onKeyDown={handleLettersKeyDown}
          />
          <Field
            label="Apellidos"
            value={form.apellido ?? ""}
            onChange={onChange("apellido")}
            onKeyDown={handleLettersKeyDown}
          />
          <Field
            label="Email"
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

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-[#8B9AA0]">
              Rol
            </span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-[#0F1315] px-4 py-3 text-sm text-white outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.rol ?? "Empleado"}
              onChange={onChange("rol")}
              disabled={!!user.isCurrentUser}
              title={
                user.isCurrentUser
                  ? "No puedes cambiar tu propio rol"
                  : "Cambiar rol"
              }
            >
              <option value="Empleado">Empleado</option>
              <option value="Administrador">Administrador</option>
            </select>
          </label>
        </div>

        <div className="mx-6 my-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose?.()}
            className="!rounded-2xl !border-white/20 !bg-transparent !px-5 !py-3 !text-[#E6E9EA] hover:!bg-white/5 focus:!ring-2 focus:!ring-[#A30862]/40"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="!rounded-2xl !bg-[#A30862] !px-5 !py-3 !text-white shadow-[0_10px_25px_rgba(163,8,98,.2)] hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40 disabled:!opacity-60"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const Field: React.FC<{
  label: string;
  type?: React.HTMLInputTypeAttribute;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}> = ({ label, type = "text", value, onChange, onKeyDown }) => (
  <label className="space-y-2">
    <span className="text-xs font-medium uppercase tracking-wide text-[#8B9AA0]">
      {label}
    </span>
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className="w-full rounded-2xl border border-white/10 bg-[#0F1315] px-4 py-3 text-sm text-white outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
    />
  </label>
);

export default EditUser;