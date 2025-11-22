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
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition " +
  "focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40 placeholder:text-white/40";

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

  const buildPayload = React.useCallback(
    () => ({
      codigo: codigo?.trim() || null,
      nombre: nombre.trim(),
      direccion: direccion?.trim() || null,
      contacto: contacto?.trim() || null,
    }),
    [codigo, nombre, direccion, contacto]
  );

  const createBodega = React.useCallback(async () => {
    const payload = buildPayload();
    if (!payload.nombre) throw new Error("El nombre es obligatorio");
    const res = await post<BodegaDto>("/api/bodegas", payload);
    return res;
  }, [post, buildPayload]);

  const updateBodega = React.useCallback(
    async (id: number) => {
      const payload = buildPayload();
      if (!payload.nombre) throw new Error("El nombre es obligatorio");
      const res = await put<BodegaDto>(`/api/bodegas/${id}`, payload);
      return res;
    },
    [put, buildPayload]
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const payload = buildPayload();
    if (!payload.nombre) {
      setError("El nombre es obligatorio");
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
      let res: BodegaDto | null = null;
      if (isEdit && initial?.bodegaID) {
        res = await updateBodega(initial.bodegaID);
      } else {
        res = await createBodega();
      }
      if (res) onSaved?.(res);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo guardar la bodega");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-white/70">Código</span>
          <input
            value={codigo ?? ""}
            onChange={e => setCodigo(e.target.value)}
            className={baseInput}
            placeholder="Ej. BOD-01"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-white/70">Nombre *</span>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
            className={baseInput}
            placeholder="Nombre de la bodega"
          />
        </label>

        <label className="md:col-span-2 grid gap-1 text-sm">
          <span className="text-white/70">Dirección</span>
          <input
            value={direccion ?? ""}
            onChange={e => setDireccion(e.target.value)}
            className={baseInput}
            placeholder="Ubicación física"
          />
        </label>

        <label className="md:col-span-2 grid gap-1 text-sm">
          <span className="text-white/70">Contacto</span>
          <input
            value={contacto ?? ""}
            onChange={e => setContacto(e.target.value)}
            className={baseInput}
            placeholder="Persona / teléfono / email"
          />
        </label>
      </div>

      <div className="mt-2 flex items-center justify-end gap-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#A30862] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isEdit ? (loading ? "Guardando…" : "Guardar cambios") : loading ? "Creando…" : "Crear bodega"}
        </button>
      </div>
    </form>
  );
}
