"use client";
import * as React from "react";
import { useApi } from "@/components/hooks/useApi";
import { VENC_API } from "@/components/vencimientos/api.routes";
import { useConfirm } from "@/components/modals/ConfirmProvider";

const WINE = "#A30862";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initial?:
    | {
        documentoVencimientoID?: number;
        titulo?: string;
        fechaISO?: string;
        tipoDocumentoID?: number;
        descripcion?: string | null;
        notificarDiasAntes?: number;
      }
    | null;
};

type TipoRow = {
  tipoDocumentoVencimientoID: number;
  nombre: string;
  isActive: boolean;
};

export default function VencimientoFormModal({
  open,
  onClose,
  onSaved,
  initial,
}: Props) {
  const { get, post, put, loading: apiLoading } = useApi();
  const confirm = useConfirm();

  const [titulo, setTitulo] = React.useState(initial?.titulo ?? "");
  const [fechaISO, setFechaISO] = React.useState(initial?.fechaISO ?? "");
  const [tipoID, setTipoID] = React.useState<number | "">(
    initial?.tipoDocumentoID ?? ""
  );
  const [descripcion, setDescripcion] = React.useState<string>(
    initial?.descripcion ?? ""
  );
  const [notificar, setNotificar] = React.useState<number | "">(
    initial?.notificarDiasAntes ?? ""
  );

  const [tipos, setTipos] = React.useState<TipoRow[]>([]);
  const [loadingTipos, setLoadingTipos] = React.useState(false);

  const [loadingDetalle, setLoadingDetalle] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isEdit = Boolean(initial?.documentoVencimientoID);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      select.dark-select option {
        background: #0b0e10;
        color: #e6e9ea;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  React.useEffect(() => {
    setTitulo(initial?.titulo ?? "");
    setFechaISO(initial?.fechaISO ?? "");
    setTipoID(initial?.tipoDocumentoID ?? "");
    setDescripcion(initial?.descripcion ?? "");
    setNotificar(initial?.notificarDiasAntes ?? "");
  }, [initial, open]);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const loadTipos = React.useCallback(async () => {
    setLoadingTipos(true);
    try {
      const res = await get<TipoRow[]>(VENC_API.tipos);
      setTipos((res ?? []).filter((t) => t.isActive !== false));
    } catch (e: any) {
      console.error("No se pudieron cargar los tipos:", e?.message ?? e);
      setTipos([]);
    } finally {
      setLoadingTipos(false);
    }
  }, [get]);

  const loadDetalleIfNeeded = React.useCallback(async () => {
    if (!open) return;
    const id = initial?.documentoVencimientoID;
    if (!id) return;

    const needsFetch =
      !initial?.titulo ||
      !initial?.fechaISO ||
      initial?.tipoDocumentoID == null;

    if (!needsFetch) return;

    setLoadingDetalle(true);
    setError(null);
    try {
      const d = await get<{
        documentoVencimientoID: number;
        titulo: string;
        descripcion?: string | null;
        tipoDocumentoVencimientoID: number;
        tipoNombre: string;
        referencia?: string | null;
        fechaEmision?: string | null;
        fechaVencimiento: string;
        notificarDiasAntes: number;
        isActive: boolean;
      }>(VENC_API.get(id));

      const toISO = (x?: string | null) =>
        x ? String(x).slice(0, 10) : "";

      setTitulo(d?.titulo ?? "");
      setFechaISO(toISO(d?.fechaVencimiento));
      setTipoID(d?.tipoDocumentoVencimientoID ?? "");
      setDescripcion(d?.descripcion ?? "");
      setNotificar(
        typeof d?.notificarDiasAntes === "number"
          ? d.notificarDiasAntes
          : ""
      );
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar el detalle.");
    } finally {
      setLoadingDetalle(false);
    }
  }, [
    get,
    open,
    initial?.documentoVencimientoID,
    initial?.titulo,
    initial?.fechaISO,
    initial?.tipoDocumentoID,
  ]);

  React.useEffect(() => {
    if (open) {
      loadTipos().catch(() => {});
      loadDetalleIfNeeded().catch(() => {});
    }
  }, [open, loadTipos, loadDetalleIfNeeded]);

  const titleOk = titulo.trim().length >= 3;
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(fechaISO);
  const tipoOk = typeof tipoID === "number";
  const notiOk =
    notificar === "" ||
    (typeof notificar === "number" &&
      notificar >= 0 &&
      notificar <= 365);
  const canSave = titleOk && dateOk && tipoOk && notiOk && !loadingDetalle;

  const handleSave = async () => {
    if (!canSave || apiLoading) return;
    setError(null);

    const trimmedTitle = titulo.trim();

    const ok = await confirm({
      title: isEdit
        ? "Guardar cambios del vencimiento"
        : "Registrar vencimiento",
      message: (
        <>
          {isEdit
            ? "¿Deseas guardar los cambios del vencimiento"
            : "¿Deseas crear el vencimiento"}{" "}
          <b>{trimmedTitle || "sin título"}</b>?
        </>
      ),
      confirmText: isEdit ? "Sí, guardar" : "Sí, crear",
      cancelText: "Cancelar",
      tone: isEdit ? "warning" : "brand",
    });

    if (!ok) return;

    try {
      const payload: any = {
        titulo: trimmedTitle,
        fechaVencimiento: fechaISO,
        tipoDocumentoVencimientoID: tipoID as number,
      };
      if (descripcion?.trim())
        payload.descripcion = descripcion.trim();
      if (notificar !== "")
        payload.notificarDiasAntes = Number(notificar);

      if (isEdit && initial?.documentoVencimientoID) {
        await put<void>(
          VENC_API.update(initial.documentoVencimientoID),
          payload
        );
      } else {
        await post<void>(VENC_API.create, payload);
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo guardar el vencimiento.");
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (
    e
  ) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      onKeyDown={onKeyDown}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B0E10] p-5 text-white shadow-[0_8px_30px_rgba(0,0,0,.35)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Editar vencimiento" : "Registrar vencimiento"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full px-2 text-white/80 hover:bg-white/10"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {(error || loadingDetalle) && (
          <div
            className={`mb-3 rounded-xl border px-3 py-2 text-sm ${
              loadingDetalle
                ? "border-white/15 bg-white/5 text-white/80"
                : "border-rose-400/30 bg-rose-400/10 text-rose-200"
            }`}
          >
            {loadingDetalle ? "Cargando detalle…" : error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Documento</Label>
            <input
              ref={inputRef}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Licencia de funcionamiento"
              className={
                inputCls +
                (titleOk ? "" : " ring-1 ring-rose-400/30")
              }
              aria-invalid={!titleOk}
              aria-describedby="help-titulo"
            />
            {!titleOk && (
              <p
                id="help-titulo"
                className="mt-1 text-xs text-rose-300"
              >
                Mínimo 3 caracteres.
              </p>
            )}
          </div>

          <div>
            <Label>Fecha de vencimiento</Label>
            <input
              type="date"
              value={fechaISO}
              onChange={(e) => setFechaISO(e.target.value)}
              className={
                inputCls +
                (dateOk ? "" : " ring-1 ring-rose-400/30")
              }
              aria-invalid={!dateOk}
              aria-describedby="help-fecha"
            />
            {!dateOk && (
              <p
                id="help-fecha"
                className="mt-1 text-xs text-rose-300"
              >
                Formato inválido (YYYY-MM-DD).
              </p>
            )}
          </div>

          <div>
            <Label>Tipo</Label>
            <div className="relative">
              <select
                value={tipoID === "" ? "" : String(tipoID)}
                onChange={(e) => {
                  const v = e.target.value;
                  setTipoID(v === "" ? "" : Number(v));
                }}
                className={`${inputCls} dark-select appearance-none pr-9 ${
                  tipoOk ? "" : " ring-1 ring-rose-400/30"
                }`}
                aria-invalid={!tipoOk}
              >
                <option value="">— Seleccionar —</option>
                {tipos.map((t) => (
                  <option
                    key={t.tipoDocumentoVencimientoID}
                    value={String(t.tipoDocumentoVencimientoID)}
                  >
                    {t.nombre}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
                ▾
              </span>
            </div>
            {loadingTipos && (
              <div className="mt-1 text-xs text-white/60">
                Cargando tipos…
              </div>
            )}
            {!loadingTipos && tipos.length === 0 && (
              <div className="mt-1 text-xs text_WHITE/60">
                No hay tipos disponibles.
              </div>
            )}
          </div>

          <div>
            <Label>
              Descripción{" "}
              <span className="text-white/40">(opcional)</span>
            </Label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Notas adicionales, número de documento, etc."
              rows={3}
              className={`${inputCls} resize-y`}
            />
          </div>

          <div>
            <Label>
              Notificar días antes{" "}
              <span className="text-white/40">(opcional)</span>
            </Label>
            <input
              type="number"
              min={0}
              max={365}
              value={notificar}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") return setNotificar("");
                const n = Number(v);
                if (!Number.isNaN(n)) setNotificar(n);
              }}
              className={
                inputCls +
                (notiOk ? "" : " ring-1 ring-rose-400/30")
              }
              aria-invalid={!notiOk}
              aria-describedby="help-notificar"
            />
            <p
              id="help-notificar"
              className="mt-1 text-xs text-white/60"
            >
              Define cuándo pasa a “Próximo”. Si lo dejas vacío, se usa
              el umbral por defecto.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSave || apiLoading}
            onClick={handleSave}
            className="rounded-xl px-4 py-2 text-sm font-semibold text_WHITE disabled:opacity-60"
            style={{ backgroundColor: WINE }}
            title="Ctrl/⌘ + Enter para guardar"
          >
            {apiLoading ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border_WHITE/10 bg_WHITE/5 px-3 py-2 text-sm text_WHITE outline-none transition " +
  "focus:border_WHITE/20 focus:ring-2 focus:ring_WHITE/20 placeholder:text_WHITE/40";

const Label: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ className = "", children }) => (
  <label
    className={[
      "mb-1 block text-xs font-medium text_WHITE/70",
      className,
    ].join(" ")}
  >
    {children}
  </label>
);
