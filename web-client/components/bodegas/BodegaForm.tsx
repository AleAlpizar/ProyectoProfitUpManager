import React from "react";
import type { BodegaDto } from "../hooks/useBodegas";
import { useApi } from "../hooks/useApi";
import { useConfirm } from "../modals/ConfirmProvider";

type Props = {
  initial?: Partial<BodegaDto> | null;
  onSaved?: (bodega: BodegaDto) => void;
  onClose?: () => void;
};

const baseInput =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none transition " +
  "focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40 placeholder:text-white/35 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const sectionLabel = "text-[13px] font-medium tracking-wide text-white/75";
const helperText = "text-[11px] text-white/40";

const CODIGO_REGEX = /^[A-Za-z0-9\-_]+$/;
const MAX_CODIGO = 30;
const MAX_NOMBRE = 120;
const MAX_DIRECCION = 250;
const MAX_CONTACTO = 150;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message?.trim()) return error.message.trim();
  return fallback;
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildCleanPayload(values: {
  codigo: string;
  nombre: string;
  direccion: string;
  contacto: string;
}) {
  const codigo = normalizeSpaces(values.codigo).toUpperCase();
  const nombre = normalizeSpaces(values.nombre);
  const direccion = normalizeSpaces(values.direccion);
  const contacto = normalizeSpaces(values.contacto);

  return {
    codigo: codigo || null,
    nombre,
    direccion: direccion || null,
    contacto: contacto || null,
  };
}

function validatePayload(payload: {
  codigo: string | null;
  nombre: string;
  direccion: string | null;
  contacto: string | null;
}) {
  if (!payload.nombre) {
    return "El nombre es obligatorio.";
  }

  if (payload.nombre.length > MAX_NOMBRE) {
    return `El nombre no puede superar los ${MAX_NOMBRE} caracteres.`;
  }

  if (payload.codigo) {
    if (payload.codigo.length > MAX_CODIGO) {
      return `El código no puede superar los ${MAX_CODIGO} caracteres.`;
    }
    if (!CODIGO_REGEX.test(payload.codigo)) {
      return "El código solo puede contener letras, números, guiones y guion bajo.";
    }
  }

  if (payload.direccion && payload.direccion.length > MAX_DIRECCION) {
    return `La dirección no puede superar los ${MAX_DIRECCION} caracteres.`;
  }

  if (payload.contacto && payload.contacto.length > MAX_CONTACTO) {
    return `El contacto no puede superar los ${MAX_CONTACTO} caracteres.`;
  }

  return null;
}

export default function BodegaForm({ initial, onSaved, onClose }: Props) {
  const isEdit = !!initial?.bodegaID;

  const [codigo, setCodigo] = React.useState(initial?.codigo ?? "");
  const [nombre, setNombre] = React.useState(initial?.nombre ?? "");
  const [direccion, setDireccion] = React.useState(initial?.direccion ?? "");
  const [contacto, setContacto] = React.useState(initial?.contacto ?? "");

  const { post, put } = useApi();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const confirm = useConfirm();

  React.useEffect(() => {
    setCodigo(initial?.codigo ?? "");
    setNombre(initial?.nombre ?? "");
    setDireccion(initial?.direccion ?? "");
    setContacto(initial?.contacto ?? "");
    setError(null);
  }, [initial]);

  const buildPayload = React.useCallback(
    () =>
      buildCleanPayload({
        codigo,
        nombre,
        direccion,
        contacto,
      }),
    [codigo, nombre, direccion, contacto]
  );

  const createBodega = React.useCallback(async () => {
    const payload = buildPayload();
    const validationError = validatePayload(payload);
    if (validationError) throw new Error(validationError);

    const res = await post<BodegaDto>("/api/bodegas", payload);
    return res;
  }, [post, buildPayload]);

  const updateBodega = React.useCallback(
    async (id: number) => {
      const payload = buildPayload();
      const validationError = validatePayload(payload);
      if (validationError) throw new Error(validationError);

      const res = await put<BodegaDto>(`/api/bodegas/${id}`, payload);
      return res;
    },
    [put, buildPayload]
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    const payload = buildPayload();
    const validationError = validatePayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    const ok = await confirm({
      title: isEdit ? "Guardar cambios de bodega" : "Crear bodega",
      message: (
        <>
          {isEdit ? "¿Deseas guardar los cambios de la bodega" : "¿Deseas crear la bodega"}{" "}
          <b>{payload.nombre}</b>?
        </>
      ),
      confirmText: isEdit ? "Sí, guardar" : "Sí, crear",
      cancelText: "Cancelar",
      tone: isEdit ? "warning" : "brand",
    });

    if (!ok) return;

    setLoading(true);
    try {
      const res =
        isEdit && initial?.bodegaID
          ? await updateBodega(initial.bodegaID)
          : await createBodega();

      onSaved?.(res);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo guardar la bodega."));
    } finally {
      setLoading(false);
    }
  };

  const onCodigoChange = (value: string) => {
    setCodigo(value);
    if (error) setError(null);
  };

  const onNombreChange = (value: string) => {
    setNombre(value);
    if (error) setError(null);
  };

  const onDireccionChange = (value: string) => {
    setDireccion(value);
    if (error) setError(null);
  };

  const onContactoChange = (value: string) => {
    setContacto(value);
    if (error) setError(null);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      {error && (
        <div
          className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 shadow-inner"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={sectionLabel}>Código</span>
          <input
            value={codigo}
            onChange={(e) => onCodigoChange(e.target.value)}
            className={baseInput}
            placeholder="Ej. BOD-01"
            maxLength={MAX_CODIGO}
            disabled={loading}
            autoComplete="off"
          />
          <span className={helperText}>Opcional. Se convertirá a mayúsculas al guardar.</span>
        </label>

        <label className="grid gap-1.5">
          <span className={sectionLabel}>
            Nombre <span className="text-rose-300">*</span>
          </span>
          <input
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            required
            className={baseInput}
            placeholder="Nombre de la bodega"
            maxLength={MAX_NOMBRE}
            disabled={loading}
            autoFocus
          />
          <span className={helperText}>{nombre.length}/{MAX_NOMBRE}</span>
        </label>

        <label className="grid gap-1.5 md:col-span-2">
          <span className={sectionLabel}>Dirección</span>
          <input
            value={direccion}
            onChange={(e) => onDireccionChange(e.target.value)}
            className={baseInput}
            placeholder="Ubicación física"
            maxLength={MAX_DIRECCION}
            disabled={loading}
          />
          <span className={helperText}>{direccion.length}/{MAX_DIRECCION}</span>
        </label>

        <label className="grid gap-1.5 md:col-span-2">
          <span className={sectionLabel}>Contacto</span>
          <input
            value={contacto}
            onChange={(e) => onContactoChange(e.target.value)}
            className={baseInput}
            placeholder="Persona, teléfono o correo"
            maxLength={MAX_CONTACTO}
            disabled={loading}
          />
          <span className={helperText}>{contacto.length}/{MAX_CONTACTO}</span>
        </label>
      </div>

      <div className="mt-1 flex items-center justify-end gap-2 border-t border-white/10 pt-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-[#A30862] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(163,8,98,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isEdit ? (loading ? "Guardando…" : "Guardar cambios") : loading ? "Creando…" : "Crear bodega"}
        </button>
      </div>
    </form>
  );
}