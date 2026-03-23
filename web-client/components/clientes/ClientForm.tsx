import React, { useMemo, useState } from "react";
import Button from "../buttons/button";
import Field from "../Inputs/fields";
import LabeledInput from "../Inputs/LabeledInput";
import { Cliente, Estado, TipoDePersona } from "./types";
import { useConfirm } from "../modals/ConfirmProvider";

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toNullableTrimmed = (value: string) => {
  const cleaned = value.trim();
  return cleaned ? cleaned : null;
};

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
    Number.isFinite(initial?.descuentoPorcentaje) ? Number(initial?.descuentoPorcentaje) : 0
  );
  const [descuentoDescripcion, setDescuentoDescripcion] = useState<string>(
    initial?.descuentoDescripcion ?? ""
  );
  const [saving, setSaving] = useState(false);

  const descuentoActual = useMemo(
    () => Math.round(initial?.descuentoPorcentaje ?? 0),
    [initial?.descuentoPorcentaje]
  );

  const setDescuentoPorcentajeSafe = (raw: number | string) => {
    const parsed = typeof raw === "string" ? Number(raw) : raw;
    if (!Number.isFinite(parsed)) {
      setDescuentoPorcentaje(0);
      return;
    }
    setDescuentoPorcentaje(clamp(parsed));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nombreClean = nombre.trim();
    const emailClean = email.trim();
    const telefonoClean = telefono.trim();
    const codigoClean = codigoCliente.trim();
    const identificacionClean = identificacion.trim();
    const direccionClean = direccion.trim();
    const descuentoDescripcionClean = descuentoDescripcion.trim();
    const descuentoSafe = Number.isFinite(descuentoPorcentaje) ? clamp(descuentoPorcentaje) : 0;

    if (!nombreClean) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (nombreClean.length > 200) {
      setError("El nombre no puede superar los 200 caracteres.");
      return;
    }

    if (emailClean && !EMAIL_REGEX.test(emailClean)) {
      setError("El correo no es válido.");
      return;
    }

    if (codigoClean.length > 50) {
      setError("El código de cliente no puede superar los 50 caracteres.");
      return;
    }

    if (identificacionClean.length > 50) {
      setError("La identificación no puede superar los 50 caracteres.");
      return;
    }

    if (telefonoClean.length > 50) {
      setError("El teléfono no puede superar los 50 caracteres.");
      return;
    }

    if (direccionClean.length > 300) {
      setError("La dirección no puede superar los 300 caracteres.");
      return;
    }

    if (descuentoDescripcionClean.length > 500) {
      setError("La nota del descuento no puede superar los 500 caracteres.");
      return;
    }

    if (descuentoSafe < 0 || descuentoSafe > 100) {
      setError("El descuento debe estar entre 0 y 100.");
      return;
    }

    const ok = await confirm({
      title: initial ? "Guardar cambios" : "Crear cliente",
      message: (
        <>
          ¿Deseas {initial ? "guardar los cambios de" : "crear a"}{" "}
          <b>{nombreClean || "cliente"}</b>?
        </>
      ),
      tone: "brand",
      confirmText: initial ? "Sí, guardar" : "Sí, crear",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    const payload: Cliente = {
      clienteID: initial?.clienteID,
      nombre: nombreClean,
      correo: toNullableTrimmed(email),
      isActive: estado === "Activo",
      codigoCliente: toNullableTrimmed(codigoCliente),
      direccion: toNullableTrimmed(direccion),
      tipoPersona,
      identificacion: toNullableTrimmed(identificacion),
      telefono: toNullableTrimmed(telefono),
      descuentoPorcentaje: descuentoSafe,
      descuentoDescripcion: toNullableTrimmed(descuentoDescripcion),
    };

    try {
      setSaving(true);
      await Promise.resolve(onSave(payload));
    } catch (err: any) {
      const apiMessage =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo guardar el cliente. Inténtalo de nuevo.";
      setError(apiMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="w-[min(100%,920px)] max-h-[92vh] overflow-y-auto rounded-2xl border border-black/70 bg-[#13171A] text-[#E6E9EA] shadow-[0_24px_70px_rgba(0,0,0,.55)] ring-1 ring-black/80"
    >
      <div className="bg-gradient-to-r from-[#171C20] via-[#13171A] to-[#13171A] px-5 pt-5 pb-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/70 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#8B9AA0]">
              Clientes
            </div>
            <h2 className="mt-3 text-[clamp(1.35rem,2vw,1.9rem)] font-semibold tracking-[0.01em] text-white">
              {initial ? "Editar cliente" : "Nuevo cliente"}
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#8B9AA0]">
              Completa los datos del cliente y define su estado, información general
              y descuento aplicado.
            </p>
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            className="!rounded-xl !border-black/70 !bg-white/[0.03] !px-4 !py-2 !text-[#E6E9EA] hover:!bg-white/8 focus:!ring-2 focus:!ring-[#A30862]/40"
          >
            Cerrar
          </Button>
        </div>
      </div>

      <div className="h-px bg-black/70" />

      {error && (
        <div className="mx-5 mt-5 rounded-xl border border-[#6C0F1C]/50 bg-[#6C0F1C]/15 px-4 py-3 text-sm text-[#F7C6CF] sm:mx-6">
          {error}
        </div>
      )}

      <div className="px-5 pt-5 pb-2 sm:px-6">
        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B9AA0]">
            Información general
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <LabeledInput
            label="Nombre"
            placeholder="Juan Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-xl border border-black/70 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Email"
            type="email"
            placeholder="correo@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-black/70 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40"
          />

          <Field label="Estado">
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as Estado)}
              className="w-full rounded-xl border border-black/70 bg-[#1C2224] px-3 py-2.5 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </Field>

          <LabeledInput
            label="Teléfono"
            placeholder="87654123"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
            className="rounded-xl border border-black/70 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40"
          />

          <LabeledInput
            label="Identificación"
            placeholder="1-1234-1234"
            value={identificacion}
            onChange={(e) => setIdentificacion(e.target.value)}
            className="rounded-xl border border-black/70 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40"
          />

          <Field label="Tipo de persona">
            <select
              value={tipoPersona}
              onChange={(e) => setTipoPersona(e.target.value as TipoDePersona)}
              className="w-full rounded-xl border border-black/70 bg-[#1C2224] px-3 py-2.5 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
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
            className="rounded-xl border border-black/70 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40 md:col-span-1 xl:col-span-2"
          />

          <LabeledInput
            label="Dirección"
            placeholder="Heredia, CR"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="rounded-xl border border-black/70 bg-[#1C2224] focus:ring-2 focus:ring-[#A30862]/40 md:col-span-2 xl:col-span-3"
          />
        </div>
      </div>

      <div className="mx-5 mt-4 h-px bg-black/70 sm:mx-6" />

      <div className="px-5 pt-5 pb-3 sm:px-6">
        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B9AA0]">
            Descuento
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-xl border border-black/70 bg-white/[0.02] p-4 xl:col-span-2">
            <label className="mb-3 block text-[11px] font-medium uppercase tracking-[0.16em] text-[#8B9AA0]">
              Porcentaje (%)
            </label>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Number.isFinite(descuentoPorcentaje) ? descuentoPorcentaje : 0}
                onChange={(e) => setDescuentoPorcentajeSafe(e.target.value)}
                className="w-full accent-[#A30862]"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={Number.isFinite(descuentoPorcentaje) ? descuentoPorcentaje : 0}
                onChange={(e) => setDescuentoPorcentajeSafe(e.target.value)}
                onBlur={() => setDescuentoPorcentajeSafe(descuentoPorcentaje)}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                className="w-20 rounded-xl border border-black/70 bg-[#1C2224] px-3 py-2 text-center text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-black/70 bg-[#171C20] px-3 py-2.5">
                <span className="block text-[10px] uppercase tracking-[0.16em] text-[#8B9AA0]">
                  Actual
                </span>
                <span className="mt-1 block text-base font-semibold text-white">
                  {descuentoActual}%
                </span>
              </div>

              <div className="rounded-xl border border-black/70 bg-[#16191D] px-3 py-2.5">
                <span className="block text-[10px] uppercase tracking-[0.16em] text-[#D9A3C4]">
                  Nuevo
                </span>
                <span className="mt-1 block text-base font-semibold text-white">
                  {Math.round(clamp(descuentoPorcentaje || 0))}%
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/70 bg-white/[0.02] p-4">
            <Field label="Notas (opcional)">
              <input
                placeholder="Escribe aquí tus notas..."
                value={descuentoDescripcion}
                onChange={(e) => setDescuentoDescripcion(e.target.value)}
                className="w-full rounded-xl border border-black/70 bg-[#1C2224] px-3 py-2.5 text-sm outline-none placeholder:text-[#8B9AA0] focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
              />
            </Field>
            <p className="mt-3 text-xs leading-5 text-[#8B9AA0]">
              Usa este espacio para dejar una nota o motivo del descuento aplicado.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2 border-t border-black/70 bg-[#111517] px-5 py-4 sm:px-6">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="!rounded-xl !border-black/70 !bg-transparent !px-5 !py-2.5 !text-[#E6E9EA] hover:!bg-white/5 focus:!ring-2 focus:!ring-[#A30862]/40"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={saving}
          className="!rounded-xl !bg-[#A30862] !px-5 !py-2.5 !text-white hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40 disabled:!opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
};

export default ClienteForm;