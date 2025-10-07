import React, { useState } from "react";
import Button from "../buttons/button";
import Field from "../Inputs/fields";
import { Cliente, Estado, TipoDePersona } from "./types";
import LabeledInput from "../Inputs/LabeledInput";


const ClienteForm = ({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Cliente;
  onCancel: () => void;
  onSave: (payload: Cliente) => void;
}) => {
  const [codigoCliente, setCodigoCliente] = useState(initial?.codigoCliente ?? "");
  const [identificacion, setIdentificacion] = useState(initial?.identificacion ?? "");
  const [tipoPersona, setTipoPersona] = useState(initial?.tipoPersona ?? "Natural"); // dropdown
  const [direccion, setDireccion] = useState(initial?.direccion ?? "");
  const [telefono, setTelefono] = useState(initial?.telefono ?? "");
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [email, setEmail] = useState(initial?.correo ?? "");
  const [estado, setEstado] = useState<Estado>(initial?.isActive ? "Activo" : "Inactivo");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validación mínima
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!email.includes("@")) return setError("El correo no es válido.");
    onSave({
      nombre: nombre.trim(),
      correo: email.trim(),
      isActive: estado == "Activo",
      clienteID: initial?.clienteID,
      codigoCliente,
      direccion,
      tipoPersona,
      identificacion,
      telefono,
    });
  };

  return (
    <form onSubmit={submit} className="w-full max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-300">
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
        <LabeledInput 
          placeholder="Juan Perez"
          label="Nombre"
          className="border-b-2"
          value={nombre}
          onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setNombre(e.target.value)}
        />

          <LabeledInput 
            placeholder="Correo electrónico"
            value={email}
            type="email"
            label="correo@company.com"
            onChange={(e) => setEmail(e.target.value)}
            className="border-b-2"
          />

        <Field label="Estado">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as Estado)}
            className="rounded-xl border border-gray-700 bg-white/5 px-3 py-2 text-sm text-white! outline-none transition focus:border-gray-500"
          >
            <option className="text-gray-900 dark:text-gray-100">Activo</option>
            <option className="text-gray-900 dark:text-gray-100">Inactivo</option>
          </select>
        </Field>
        
        
        <LabeledInput 
            label="Telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="87654123"
            className="border-b-2"
          />

        <LabeledInput 
          label="Identificacion"
          value={identificacion}
          onChange={(e) => setIdentificacion(e.target.value)}
          placeholder="112341234"
          className="border-b-2"
        />

        <Field label="Tipo De Persona">
          <select
            value={tipoPersona}
            onChange={(e) => setTipoPersona(e.target.value as TipoDePersona)}
            className="rounded-xl border border-gray-700 bg-white/5 px-3 py-2 text-sm text-white! outline-none transition focus:border-gray-500"
          >
            <option className="text-gray-900 dark:text-gray-100">Natural</option>
            <option className="text-gray-900 dark:text-gray-100">Juridica</option>
          </select>
        </Field>

        <LabeledInput 
          label="Codigo Cliente"
          value={codigoCliente}
          onChange={(e) => setCodigoCliente(e.target.value)}
          placeholder="EJMPL-123"
          className="border-b-2"
        />
        <LabeledInput 
          label="Direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Heredia, CR"
          className="border-b-2"
        />
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