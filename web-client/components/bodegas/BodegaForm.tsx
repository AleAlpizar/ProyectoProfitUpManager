import React from "react";
import type { BodegaDto } from "../hooks/useBodegas";
import { useApi } from "../hooks/useApi";

type Props = {
  initial?: Partial<BodegaDto> | null;
  onSaved?: (bodega: BodegaDto) => void;
  onClose?: () => void;
};

export default function BodegaForm({ initial, onSaved, onClose }: Props) {
  const isEdit = !!initial?.bodegaID;

  const [codigo, setCodigo] = React.useState(initial?.codigo ?? "");
  const [nombre, setNombre] = React.useState(initial?.nombre ?? "");
  const [direccion, setDireccion] = React.useState(initial?.direccion ?? "");
  const [contacto, setContacto] = React.useState(initial?.contacto ?? "");

  const { post, put } = useApi();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const buildPayload = React.useCallback(() => {
    return {
      codigo: codigo?.trim() || null,
      nombre: nombre.trim(),
      direccion: direccion?.trim() || null,
      contacto: contacto?.trim() || null,
    };
  }, [codigo, nombre, direccion, contacto]);

  const createBodega = React.useCallback(
    async () => {
      const payload = buildPayload();
      if (!payload.nombre) throw new Error("El nombre es obligatorio");
      const res = await post<BodegaDto>("/api/bodegas", payload);
      return res;
    },
    [post, buildPayload]
  );

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
    <form onSubmit={onSubmit} className="grid gap-3">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <label className="grid gap-1 text-sm">
        <span>Código</span>
        <input
          value={codigo ?? ""}
          onChange={(e) => setCodigo(e.target.value)}
          className="rounded-md border border-white/10 bg-neutral-900 px-3 py-2 outline-none"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span>Nombre *</span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="rounded-md border border-white/10 bg-neutral-900 px-3 py-2 outline-none"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span>Dirección</span>
        <input
          value={direccion ?? ""}
          onChange={(e) => setDireccion(e.target.value)}
          className="rounded-md border border-white/10 bg-neutral-900 px-3 py-2 outline-none"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span>Contacto</span>
        <input
          value={contacto ?? ""}
          onChange={(e) => setContacto(e.target.value)}
          className="rounded-md border border-white/10 bg-neutral-900 px-3 py-2 outline-none"
        />
      </label>

      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[#A30862] px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isEdit ? (loading ? "Guardando…" : "Guardar cambios") : (loading ? "Creando…" : "Crear bodega")}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 px-4 py-2 text-sm"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
