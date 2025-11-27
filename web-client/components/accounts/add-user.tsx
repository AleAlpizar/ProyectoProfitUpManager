import React from "react";
import Button from "../buttons/button";
import Modal from "../modals/Modal";
import { createUser, RegisterInput, Role } from "./accounts.api";
import { useSession } from "../hooks/useSession";
import { useConfirm } from "../modals/ConfirmProvider";

type Props = {
  onCreated?: (u: {
    usuarioId: number;
    nombre: string;
    apellido?: string;
    correo: string;
    rol: Role;
  }) => void;
};

export const AddUser: React.FC<Props> = ({ onCreated }) => {
  const [visible, setVisible] = React.useState<boolean>(false);
  const [form, setForm] = React.useState<RegisterInput>({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    password: "",
    rol: "Empleado",
  });
  const [loading, setLoading] = React.useState<boolean>(false);
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
    (k: keyof RegisterInput) =>
    (e: any) => {
      let value: string = e.target.value;

      if (k === "nombre" || k === "apellido") {
        value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]/g, "");
      }

      if (k === "telefono") {
        value = value.replace(/\D/g, "");
      }

      setForm((f) => ({ ...f, [k]: value }));
    };

  const handleLettersKeyDown = (e: any) => {
    const key: string = e.key;
    if (key.length > 1) return; 

    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]$/;
    if (!regex.test(key)) {
      e.preventDefault();
    }
  };

  const handleNumbersKeyDown = (e: any) => {
    const key: string = e.key;
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
    if (!form.correo.includes("@")) return setError("Correo inválido.");
    if (!form.password || form.password.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres.");

    const ok = await confirm({
      title: "Crear usuario",
      message: (
        <>
          ¿Deseas crear al usuario <b>{form.nombre}</b> con rol {form.rol}?
        </>
      ),
      tone: "brand",
      confirmText: "Sí, crear",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    try {
      setLoading(true);
      const res = await createUser(form, authHeader as any);
      onCreated?.({
        usuarioId: res.usuarioId,
        nombre: form.nombre,
        apellido: form.apellido,
        correo: form.correo,
        rol: form.rol,
      });
      close();
    } catch (err: any) {
      setError(err?.message || "No se pudo crear el usuario.");
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
        Nuevo usuario
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
                  Usuarios
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-wide">
                  Crear usuario
                </h2>
                <p className="mt-1 text-sm text-[#8B9AA0]">
                  Completa los datos para registrar un nuevo usuario.
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
                label="Primer nombre"
                value={form.nombre}
                onChange={onChange("nombre")}
                onKeyDown={handleLettersKeyDown}
                autoFocus
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
                value={form.correo}
                onChange={onChange("correo")}
              />
              <Field
                label="Teléfono"
                value={form.telefono ?? ""}
                onChange={onChange("telefono")}
                onKeyDown={handleNumbersKeyDown}
              />
              <Field
                label="Contraseña"
                type="password"
                value={form.password}
                onChange={onChange("password")}
                helper="Mínimo 6 caracteres."
              />

              <label className="space-y-1">
                <span className="text-xs text-[#8B9AA0]">Rol</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-[#0F1315] px-3 py-2.5 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
                  value={form.rol}
                  onChange={onChange("rol")}
                >
                  <option value="Empleado">Empleado</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </label>
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
                {loading ? "Guardando..." : "Guardar usuario"}
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
  helper?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: any) => void;
}> = ({ label, type = "text", value, onChange, helper, autoFocus, onKeyDown }) => (
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
    {helper && (
      <span className="block text-[11px] text-[#8B9AA0]">{helper}</span>
    )}
  </label>
);

export default AddUser;
