import React, { useState } from "react";
import Button from "../buttons/button";
import Field from "../Inputs/fields";
import LabeledInput from "../Inputs/LabeledInput";
import { Cliente, Estado, TipoDePersona } from "./types";
import { useConfirm } from "../modals/ConfirmProvider";

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

const ClienteForm = ({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Cliente;
  onCancel: () => void;
  onSave: (payload: Cliente) => void | Promise<void>;
}) => {
  const confirm = useConfirm();

  const [codigoCliente, setCodigoCliente] = useState(initial?.codigoCliente ?? "");
  const [identificacion, setIdentificacion] = useState(initial?.identificacion ?? "");
  const [tipoPersona, setTipoPersona] = useState<TipoDePersona>(initial?.tipoPersona ?? "Natural");
  const [direccion, setDireccion] = useState(initial?.direccion ?? "");
  const [telefono, setTelefono] = useState(initial?.telefono ?? "");
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [email, setEmail] = useState(initial?.correo ?? "");
  const [estado, setEstado] = useState<Estado>(initial?.isActive ? "Activo" : "Inactivo");
  const [error, setError] = useState<string | null>(null);
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<number>(
    initial?.descuentoPorcentaje ?? 0
  );
  const [descuentoDescripcion, setDescuentoDescripcion] = useState<string>(
    initial?.descuentoDescripcion ?? ""
  );
  const [saving, setSaving] = useState(false);

  const setDescuentoPorcentajeSafe = (raw: number | string) => {
    const n = typeof raw === "string" ? parseFloat(raw) : raw;
    if (Number.isNaN(n)) return setDescuentoPorcentaje(0);
    setDescuentoPorcentaje(clamp(n));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!email.includes("@")) return setError("El correo no es válido.");

    const ok = await confirm({
      title: initial ? "Guardar cambios" : "Crear cliente",
      message: (
        <>
          ¿Deseas {initial ? "guardar los cambios de" : "crear a"}{" "}
          <b>{nombre || "cliente"}</b>?
        </>
      ),
      tone: "brand",
      confirmText: initial ? "Sí, guardar" : "Sí, crear",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    const payload: Cliente = {
      nombre: nombre.trim(),
      correo: email.trim(),
      isActive: estado === "Activo",
      clienteID: initial?.clienteID,
      codigoCliente,
      direccion,
      tipoPersona,
      identificacion,
      telefono,
      descuentoPorcentaje,
      descuentoDescripcion,
    };

    try {
      setSaving(true);
      await Promise.resolve(onSave(payload));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-[900px] sm:max-w-3xl lg:max-w-4xl rounded-3xl border border-white/10 bg-[#13171A] text-[#E6E9EA] shadow-[0_30px_80px_rgba(0,0,0,.55)] ring-1 ring-black/20"
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-[#8B9AA0]">
            Clientes
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-wide">
            {initial ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <p className="mt-1 text-sm text-[#8B9AA0]">
            Completa los datos para registrar un cliente.
          </p>
        </div>
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="!rounded-xl !border-white/20 !bg-transparent !text-[#E6E9EA] hover:!bg-white/5 focus:!ring-2 focus:!ring-[#A30862]/40"
        >
          Cerrar
        </Button>
      </div>

      <div className="mx-6 my-4 h-px bg-white/10" />

      {error && (
        <div className="mx-6 mb-4 rounded-2xl border border-[#6C0F1C]/40 bg-[#6C0F1C]/15 px-4 py-3 text-sm text-[#F7C6CF]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 px-6 pb-2 sm:grid-cols-3">
        <LabeledInput
          label="Nombre"
          placeholder="Juan Pérez"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="rounded-2xl border border-white/10 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40"
        />

        <LabeledInput
          label="Email"
          type="email"
          placeholder="correo@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl border border-white/10 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40"
        />

        <Field label="Estado">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as Estado)}
            className="w-full rounded-2xl border border-white/10 bg-[#1C2224] px-3 py-2 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </Field>

        <LabeledInput
          label="Teléfono"
          placeholder="8765 4123"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))} 
          className="rounded-2xl border border-white/10 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40"
        />

        <LabeledInput
          label="Identificación"
          placeholder="1-1234-1234"
          value={identificacion}
          onChange={(e) => setIdentificacion(e.target.value)}
          className="rounded-2xl border border-white/10 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40"
        />

        <Field label="Tipo de persona">
          <select
            value={tipoPersona}
            onChange={(e) => setTipoPersona(e.target.value as TipoDePersona)}
            className="w-full rounded-2xl border border-white/10 bg-[#1C2224] px-3 py-2 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
          >
            <option value="Natural">Natural</option>
            <option value="Juridico">Jurídica</option>
          </select>
        </Field>

        <LabeledInput
          label="Código cliente"
          placeholder="EJMPL-123"
          value={codigoCliente}
          onChange={(e) => setCodigoCliente(e.target.value)}
          className="rounded-2xl border border-white/10 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40 sm:col-span-2"
        />

        <LabeledInput
          label="Dirección"
          placeholder="Heredia, CR"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="rounded-2xl border border-white/10 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40 sm:col-span-3"
        />

        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs text-[#8B9AA0]">Porcentaje (%)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={descuentoPorcentaje}
              onChange={(e) => setDescuentoPorcentajeSafe(e.target.value)}
              className="w-full accent-[#A30862]"
            />
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={Number.isNaN(descuentoPorcentaje) ? 0 : descuentoPorcentaje}
              onChange={(e) => setDescuentoPorcentaje(parseFloat(e.target.value))}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              className="w-20 rounded-2xl border border-white/10 bg-[#1C2224] px-2 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#8B9AA0]">
            <span>
              Actual: <b className="text-white">{initial?.descuentoPorcentaje ?? 0}%</b>
            </span>
            <span>
              Nuevo: <b className="text-white">{Math.round(descuentoPorcentaje)}%</b>
            </span>
          </div>
        </div>

        <Field label="Notas (opcional)">
          <input
            placeholder="Escribe aquí tus notas…"
            value={descuentoDescripcion}
            onChange={(e) => setDescuentoDescripcion(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#1C2224] px-3 py-2 text-sm outline-none placeholder:text-[#8B9AA0] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
          />
        </Field>
      </div>

      <div className="mx-6 mt-4 mb-6 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="!rounded-2xl !border-white/20 !bg-transparent !text-[#E6E9EA] hover:!bg-white/5 focus:!ring-2 focus:!ring-[#A30862]/40"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={saving}
          className="!rounded-2xl !bg-[#A30862] !text-white hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40 disabled:!opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
};

export default ClienteForm;
