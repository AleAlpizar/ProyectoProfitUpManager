import React from "react";
import Button from "../buttons/button";
import Field from "../Inputs/fields";
import { Cliente, Estado } from "./types";


const ClienteForm = ({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Cliente;
  onCancel: () => void;
  onSave: (payload: Cliente) => void;
}) => {
  const [nombre, setNombre] = React.useState(initial?.nombre ?? "");
  const [email, setEmail] = React.useState(initial?.email ?? "");
  const [estado, setEstado] = React.useState<Estado>(initial?.estado ?? "Activo");
  const [error, setError] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validación mínima
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!email.includes("@")) return setError("El correo no parece válido.");
    onSave({
      nombre: nombre.trim(), email: email.trim(), estado,
      id: "",
      totalCompras: 0
    });
  };

  return (
    <form onSubmit={submit} className="w-full max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">
          {initial ? "Editar cliente" : "Nuevo cliente"}
        </h2>
        <Button variant="primary" type="button" onClick={onCancel}>
          Cerrar
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-md bg-danger px-4 py-2 text-sm text-white">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Nombre">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del cliente"
            className="border-b-2"
          />
        </Field>
        <Field label="Correo">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@empresa.com"
            className="border-b-2"
          />
        </Field>
        <Field label="Estado">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as Estado)}
            className="input"
          >
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit">
          Guardar
        </Button>
      </div>
    </form>
  );
}



export default ClienteForm;