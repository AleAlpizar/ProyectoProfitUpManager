"use client";
import * as React from "react";
import { EstadoBadge, Th, Td, Label, fmtISO } from "./SmallUI";
import { useAlertas } from "./useVencimientos";
import type {
  AlertRowDto,
  EstadoVto,
  VencimientoDetalleDto,
  VencimientoUpdateDto,
} from "./types";
import { useApi } from "@/components/hooks/useApi";
import { VENC_API } from "@/components/vencimientos/api.routes";
import { useConfirm } from "@/components/modals/ConfirmProvider";

function useDebounced<T>(value: T, ms = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

type Props = {
  onEdit: (id: number) => void;
};

type SortKey = "titulo" | "fecha" | "faltan" | "tipo" | "estado";
type SortDir = "asc" | "desc";

const ESTADOS: Array<{ key: EstadoVto | ""; label: string }> = [
  { key: "", label: "Todos" },
  { key: "VIGENTE", label: "Vigente" },
  { key: "PROXIMO", label: "Próximo" },
  { key: "VENCIDO", label: "Vencido" },
];

const WINE = "#A30862";

export default function AlertasTable({ onEdit }: Props) {
  const { data, loading, error, reload } = useAlertas(7);
  const { get, del, put } = useApi();
  const confirm = useConfirm();

  const [qDoc, setQDoc] = React.useState("");
  const [qFecha, setQFecha] = React.useState("");
  const [qTipo, setQTipo] = React.useState("");
  const [qEstado, setQEstado] = React.useState<EstadoVto | "">("");
  const [rango, setRango] = React.useState<"" | "hoy" | "7" | "30">("");

  const [sort, setSort] = React.useState<{ key: SortKey; dir: SortDir }>({
    key: "fecha",
    dir: "asc",
  });

  const [busyRow, setBusyRow] = React.useState<number | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const [preview, setPreview] = React.useState<{
    open: boolean;
    item?: VencimientoDetalleDto | null;
    loading?: boolean;
    error?: string | null;
  }>({ open: false });

  const qDocDebounced = useDebounced(qDoc, 300);

  React.useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      select.dark-select option { background:#0b0e10; color:#e6e9ea; }
      select.dark-select:focus { outline:none; box-shadow:0 0 0 2px ${WINE}40; border-color:${WINE}66; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const tipos = React.useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => set.add(r.tipoNombre));
    return Array.from(set).sort();
  }, [data]);

  const toggleSort = (key: SortKey) => {
    setSort((cur) =>
      cur.key === key
        ? { key, dir: cur.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  const rows = React.useMemo(() => {
    const byRange = (r: AlertRowDto) => {
      if (rango === "") return true;
      const d = r.daysToDue;
      if (rango === "hoy") return d === 0;
      if (rango === "7") return d >= 0 && d <= 7;
      if (rango === "30") return d >= 0 && d <= 30;
      return true;
    };

    const filtered = data
      .filter(
        (r) =>
          !qDocDebounced ||
          r.titulo
            .toLowerCase()
            .includes(qDocDebounced.trim().toLowerCase())
      )
      .filter((r) => !qFecha || fmtISO(r.fechaVencimiento) === qFecha)
      .filter((r) => !qTipo || r.tipoNombre === qTipo)
      .filter((r) => !qEstado || r.estado === qEstado)
      .filter(byRange);

    const compare = (a: AlertRowDto, b: AlertRowDto) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      switch (sort.key) {
        case "titulo":
          return a.titulo.localeCompare(b.titulo) * dir;
        case "tipo":
          return a.tipoNombre.localeCompare(b.tipoNombre) * dir;
        case "estado":
          return a.estado.localeCompare(b.estado) * dir;
        case "faltan":
          return (a.daysToDue - b.daysToDue) * dir;
        default:
          return (
            a.fechaVencimiento.localeCompare(b.fechaVencimiento) *
            dir
          );
      }
    };

    return filtered.sort(compare);
  }, [data, qDocDebounced, qFecha, qTipo, qEstado, rango, sort]);

  const counts = React.useMemo(() => {
    const base = {
      total: data.length,
      VIGENTE: 0,
      PROXIMO: 0,
      VENCIDO: 0,
    } as Record<"total" | EstadoVto, number>;
    data.forEach((r) => (base[r.estado] += 1));
    return base;
  }, [data]);

  const exportCsv = () => {
    const header = [
      "Documento",
      "Vence",
      "Faltan",
      "Estado",
      "Tipo",
      "Referencia",
    ].join(",");
    const lines = rows.map((r) =>
      [
        safeCsv(r.titulo),
        fmtISO(r.fechaVencimiento),
        r.daysToDue,
        r.estado,
        safeCsv(r.tipoNombre),
        safeCsv(r.referencia ?? ""),
      ].join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alertas.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const doEdit = (id: number) => onEdit(id);

  const doDelete = async (id: number, titulo: string) => {
    const ok = await confirm({
      title: "Eliminar vencimiento",
      message: (
        <>
          ¿Eliminar el vencimiento <b>{titulo}</b>?<br />
          Esta acción no se puede deshacer.
        </>
      ),
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    });
    if (!ok) return;

    setActionError(null);
    setBusyRow(id);
    try {
      await del<void>(VENC_API.delete(id));
      await reload();
    } catch (e: any) {
      setActionError(e?.message ?? "No se pudo eliminar.");
    } finally {
      setBusyRow(null);
    }
  };

  const doDone = async (id: number, titulo: string) => {
    const ok = await confirm({
      title: "Marcar como hecha",
      message: (
        <>
          ¿Marcar el vencimiento <b>{titulo}</b> como hecho?
          <br />
          Ya no aparecerá en las alertas.
        </>
      ),
      confirmText: "Sí, marcar",
      cancelText: "Cancelar",
      tone: "brand",
    });
    if (!ok) return;

    setActionError(null);
    setBusyRow(id);
    try {
      const detalle = await get<VencimientoDetalleDto>(
        VENC_API.get(id)
      );
      if (!detalle)
        throw new Error("No se encontró el documento.");

      const payload: VencimientoUpdateDto = {
        titulo: detalle.titulo,
        descripcion: detalle.descripcion ?? null,
        tipoDocumentoVencimientoID:
          detalle.tipoDocumentoVencimientoID,
        referencia: detalle.referencia ?? null,
        fechaEmision: detalle.fechaEmision ?? null,
        fechaVencimiento: detalle.fechaVencimiento,
        notificarDiasAntes: detalle.notificarDiasAntes,
        isActive: false,
      };

      await put<void>(VENC_API.update(id), payload);
      await reload();
    } catch (e: any) {
      setActionError(
        e?.message ?? "No se pudo marcar como hecha."
      );
    } finally {
      setBusyRow(null);
    }
  };

  const doPreview = async (id: number) => {
    setPreview({
      open: true,
      loading: true,
      item: null,
      error: null,
    });
    try {
      const detalle = await get<VencimientoDetalleDto>(
        VENC_API.get(id)
      );
      setPreview({
        open: true,
        loading: false,
        item: detalle ?? null,
        error: null,
      });
    } catch (e: any) {
      setPreview({
        open: true,
        loading: false,
        item: null,
        error: e?.message ?? "No se pudo cargar el detalle.",
      });
    }
  };
  const closePreview = () => setPreview({ open: false });

  return (
    <>
      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white/90">
            Filtros
          </h2>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>Total: {counts.total}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-emerald-300 ring-1 ring-emerald-400/30">
              Vigente {counts.VIGENTE}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/20 px-2 py-0.5 text-yellow-300 ring-1 ring-yellow-400/30">
              Próximo {counts.PROXIMO}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-400/20 px-2 py-0.5 text-red-300 ring-1 ring-red-400/30">
              Vencido {counts.VENCIDO}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Documento</Label>
            <input
              value={qDoc}
              onChange={(e) => setQDoc(e.target.value)}
              placeholder="Ej: Permiso sanitario"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <Label>Fecha de vencimiento</Label>
            <input
              type="date"
              value={qFecha}
              onChange={(e) => setQFecha(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <Label>Tipo</Label>
            <div className="relative">
              <select
                value={qTipo}
                onChange={(e) => setQTipo(e.target.value)}
                className="dark-select w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 pr-9 text-sm text-white outline-none focus:border-[#A30862]/40 focus:ring-2 focus:ring-[#A30862]/40"
                title="Filtrar por tipo"
              >
                <option value="" className="text-black">
                  Todos
                </option>
                {Array.from(tipos).map((t) => (
                  <option
                    key={t}
                    value={t}
                    className="text-black"
                  >
                    {t}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
                ▾
              </span>
            </div>
          </div>

          <div>
            <Label>Estado</Label>
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map((e) => (
                <button
                  key={e.label}
                  type="button"
                  onClick={() => setQEstado(e.key)}
                  className={[
                    "rounded-full px-3 py-1 text-xs ring-1 transition",
                    e.key === ""
                      ? "bg-white/5 text-white/80 ring-white/15 hover:bg-white/10"
                      : e.key === "VIGENTE"
                      ? "bg-emerald-400/20 text-emerald-300 ring-emerald-400/30"
                      : e.key === "PROXIMO"
                      ? "bg-yellow-400/20 text-yellow-300 ring-yellow-400/30"
                      : "bg-red-400/20 text-red-300 ring-red-400/30",
                    qEstado === e.key ? "ring-2" : "",
                  ].join(" ")}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TipoPill
            label="Todos"
            active={!qTipo}
            onClick={() => setQTipo("")}
          />
          {tipos.map((t) => (
            <TipoPill
              key={t}
              label={t}
              active={qTipo === t}
              onClick={() => setQTipo(t)}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-white/70">Vence en:</span>
            <button
              onClick={() => setRango("")}
              className={chipCls(rango === "")}
              title="Sin filtro"
            >
              Todos
            </button>
            <button
              onClick={() => setRango("hoy")}
              className={chipCls(rango === "hoy")}
            >
              Hoy
            </button>
            <button
              onClick={() => setRango("7")}
              className={chipCls(rango === "7")}
            >
              ≤ 7 días
            </button>
            <button
              onClick={() => setRango("30")}
              className={chipCls(rango === "30")}
            >
              ≤ 30 días
            </button>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              style={{ borderColor: `${WINE}66` }}
            >
              Refrescar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              onClick={() => {
                setQDoc("");
                setQFecha("");
                setQTipo("");
                setQEstado("");
                setRango("");
              }}
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              title="Exportar resultados a CSV"
              style={{ borderColor: `${WINE}66` }}
            >
              Exportar CSV
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur">
          Alertas de vencimiento
        </div>

        {actionError && (
          <div className="mx-4 mt-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
            {actionError}
          </div>
        )}
        {error && (
          <div className="mx-4 mt-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
                <Th>
                  <SortBtn
                    onClick={() => toggleSort("titulo")}
                    active={sort.key === "titulo"}
                    dir={sort.dir}
                  >
                    Documento
                  </SortBtn>
                </Th>
                <Th>
                  <SortBtn
                    onClick={() => toggleSort("fecha")}
                    active={sort.key === "fecha"}
                    dir={sort.dir}
                  >
                    Vence
                  </SortBtn>
                </Th>
                <Th>
                  <SortBtn
                    onClick={() => toggleSort("faltan")}
                    active={sort.key === "faltan"}
                    dir={sort.dir}
                  >
                    Faltan
                  </SortBtn>
                </Th>
                <Th>
                  <SortBtn
                    onClick={() => toggleSort("estado")}
                    active={sort.key === "estado"}
                    dir={sort.dir}
                  >
                    Estado
                  </SortBtn>
                </Th>
                <Th>
                  <SortBtn
                    onClick={() => toggleSort("tipo")}
                    active={sort.key === "tipo"}
                    dir={sort.dir}
                  >
                    Tipo
                  </SortBtn>
                </Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-white/60"
                  >
                    Cargando…
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-white/60"
                  >
                    No hay resultados para los filtros aplicados.
                  </td>
                </tr>
              )}

              {rows.map((r) => {
                const isBusy =
                  busyRow === r.documentoVencimientoID;
                return (
                  <tr
                    key={r.documentoVencimientoID}
                    className={`hover:bg-white/5 ${
                      r.estado === "PROXIMO"
                        ? "bg-yellow-500/5"
                        : ""
                    }`}
                  >
                    <Td className="font-medium text-white">
                      {r.titulo}
                    </Td>
                    <Td>{fmtISO(r.fechaVencimiento)}</Td>
                    <Td>
                      {r.daysToDue < 0
                        ? `-${Math.abs(
                            r.daysToDue
                          )} días`
                        : `${r.daysToDue} días`}
                    </Td>
                    <Td>
                      <EstadoBadge
                        estado={r.estado as EstadoVto}
                      />
                    </Td>
                    <Td>{r.tipoNombre}</Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            doPreview(
                              r.documentoVencimientoID
                            )
                          }
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                          title="Ver detalle"
                          style={{ borderColor: `${WINE}40` }}
                        >
                          Ver
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            doEdit(
                              r.documentoVencimientoID
                            )
                          }
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                          disabled={isBusy}
                          title="Editar"
                          style={{ borderColor: `${WINE}40` }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            doDone(
                              r.documentoVencimientoID,
                              r.titulo
                            )
                          }
                          className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-400/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-50"
                          disabled={isBusy}
                          title="Marcar como hecha"
                        >
                          {isBusy
                            ? "Aplicando…"
                            : "Hecha"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            doDelete(
                              r.documentoVencimientoID,
                              r.titulo
                            )
                          }
                          className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-400/20 focus:outline-none focus:ring-2 focus:ring-rose-400/30 disabled:opacity-50"
                          disabled={isBusy}
                          title="Eliminar"
                        >
                          {isBusy
                            ? "Eliminando…"
                            : "Eliminar"}
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 ring-1 bg-emerald-400/20 text-emerald-300 ring-emerald-400/30">
            Vigente
          </span>
          <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 ring-1 bg-yellow-400/20 text-yellow-300 ring-yellow-400/30">
            Próximo (según “Notificar días antes”)
          </span>
          <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 ring-1 bg-red-400/20 text-red-300 ring-red-400/30">
            Vencido
          </span>
        </div>
      </section>

      {preview.open && (
        <div
          className="fixed inset-0 z-[1300] flex items-end md:items-center justify-center bg-black/60"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget)
              closePreview();
          }}
        >
          <div
            className="
              w-[calc(100%-2rem)]
              max-w-lg
              rounded-2xl
              border border-white/10
              bg-[#0f1214]
              p-4
              text-white
              shadow-2xl
              max-h-[85vh]
              overflow-auto
            "
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">
                Detalle del documento
              </div>
              <button
                className="rounded-full px-2 text-white/80 hover:bg-white/10"
                onClick={closePreview}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {preview.loading && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                Cargando…
              </div>
            )}

            {preview.error && (
              <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">
                {preview.error}
              </div>
            )}

            {!preview.loading &&
              !preview.error &&
              preview.item && (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-white/60">
                      Documento
                    </div>
                    <div className="text-sm font-medium">
                      {preview.item.titulo}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-white/60">
                        Tipo
                      </div>
                      <div className="text-sm">
                        {preview.item.tipoNombre}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text_WHITE/60">
                        Vence
                      </div>
                      <div className="text-sm">
                        {fmtISO(
                          preview.item.fechaVencimiento
                        )}
                      </div>
                    </div>
                  </div>

                  {preview.item.referencia && (
                    <div>
                      <div className="text-xs text_WHITE/60">
                        Referencia
                      </div>
                      <div
                        className="text-sm break-words"
                        style={{
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
                        {preview.item.referencia}
                      </div>
                    </div>
                  )}

                  {preview.item.descripcion && (
                    <div>
                      <div className="text-xs text_WHITE/60">
                        Descripción
                      </div>
                      <div
                        className="whitespace-pre-wrap text-sm text_WHITE/80 break-words"
                        style={{
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
                        {preview.item.descripcion}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {preview.item.fechaEmision && (
                      <div>
                        <div className="text-xs text_WHITE/60">
                          Emisión
                        </div>
                        <div className="text-sm">
                          {fmtISO(
                            preview.item.fechaEmision
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text_WHITE/60">
                        Notificar días antes
                      </div>
                      <div className="text-sm">
                        {preview.item.notificarDiasAntes}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        onEdit(
                          preview.item!
                            .documentoVencimientoID
                        );
                        closePreview();
                      }}
                      className="rounded-xl border border_WHITE/15 bg_WHITE/5 px-4 py-2 text-sm hover:bg_WHITE/10"
                      style={{ borderColor: `${WINE}66` }}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </>
  );
}

function SortBtn({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 hover:underline ${
        active ? "text-white" : ""
      }`}
      title="Ordenar"
    >
      {children}
      <span className="text-xs">
        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

function chipCls(active: boolean) {
  return [
    "rounded-full px-2.5 py-1 text-xs ring-1 transition",
    active
      ? "bg-white/20 ring-white/30 text-white"
      : "bg-white/5 ring-white/15 text-white/80 hover:bg-white/10",
  ].join(" ");
}

function TipoPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "whitespace-nowrap rounded-full px-3 py-1 text-xs ring-1 transition",
        active
          ? "text-white bg-[#A30862]/20 ring-[#A30862]/40"
          : "text-white/80 bg-white/5 ring-white/15 hover:bg-white/10",
      ].join(" ")}
      title={`Filtrar: ${label}`}
    >
      {label}
    </button>
  );
}

function safeCsv(x: string) {
  const s = (x ?? "").replace(/"/g, '""');
  return `"${s}"`;
}
