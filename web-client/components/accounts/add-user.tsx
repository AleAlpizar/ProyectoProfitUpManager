import React from "react";
import Button from "../buttons/button";
import Modal from "../modals/Modal";
import { createUser, RegisterInput, Role } from "./accounts.api";
import { useSession } from "@/hooks/useSession";



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
  const [visible, setVisible] = React.useState(false);
  const [form, setForm] = React.useState<RegisterInput>({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    password: "",
    rol: "Empleado",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { authHeader } = useSession();

  const open = () => setVisible(true);
  const close = () => { setVisible(false); setError(null); setLoading(false); };

  const onChange = (k: keyof RegisterInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async () => {
    setError(null);
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (!form.correo.includes("@")) return setError("Correo inválido.");
    if (!form.password || form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
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
      <Button onClick={open}>Add User</Button>

      {visible && (
        <Modal onClose={close}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary">Crear usuario</h2>
              <button onClick={close} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {error && (
              <div className="rounded-md bg-primary-foreground px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Primer nombre</label>
                <input className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.nombre} onChange={onChange("nombre")} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Apellidos</label>
                <input className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.apellido} onChange={onChange("apellido")} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Email</label>
                <input type="email" className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.correo} onChange={onChange("correo")} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Teléfono</label>
                <input className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.telefono ?? ""} onChange={onChange("telefono")} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Contraseña</label>
                <input type="password" className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.password} onChange={onChange("password")} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Rol</label>
                <select className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.rol} onChange={onChange("rol")}>
                  <option value="Empleado">Empleado</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={close}>Cancelar</Button>
              <Button onClick={onSubmit} disabled={loading}>{loading ? "Guardando..." : "Guardar usuario"}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
