"use client";

import React from "react";
import { createPortal } from "react-dom";
import EditarCantidadModal from "@/components/inventario/EditarCantidadModal";

import { useProductoDetalle } from "../hooks/useProductoDetalle";
import { useProductoInactivar } from "../hooks/useProductoInactivar";
import { useBodegas } from "../hooks/useBodegas";
import { useApi } from "@/components/hooks/useApi";

import { ProductoFiltroDropdown } from "./ProductoFiltroDropdown";

type ProductoMini = {
  productoID: number;
  sku?: string | null;
  nombre: string;
  descripcion?: string | null;
  descuento?: number | null;
  precioVenta?: number | null;
  isActive?: boolean;
};

type Row = ProductoMini;
type Props = { filtroId: number | "" };
type EstadoFiltro = "activos" | "inactivos" | "todos";
type Unidad = { unidadID: number; codigo: string; nombre: string; activo: boolean };

const WINE = "#A30862";

type EditModalState = {
  open: boolean;
  id?: number;
  nombre: string;
  descripcion: string;
  descuento: number | null;
  precioVenta: number | null;
  sku?: string | null;
  codigoInterno?: string | null;
  unidadAlmacenamientoID?: number | null;
  precioCosto?: number | null;
  peso?: number | null;
  largo?: number | null;
  alto?: number | null;
  ancho?: number | null;
};

export default function ProductosTable({ filtroId }: Props) {
  const { call } = useApi();
  const { detalle, loadDetalle } = useProductoDetalle();
  const { inactivar } = useProductoInactivar();
  const { data: bodegas = [] } = useBodegas();

  const [estado, setEstado] = React.useState<EstadoFiltro>("activos");

  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [unidades, setUnidades] = React.useState<Unidad[]>([]);
  const unidadNombre = React.useCallback(
    (id?: number | null) =>
      id == null ? undefined : unidades.find((u) => u.unidadID === id)?.nombre,
    [unidades]
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await call<Row[]>(`/api/productos/mini?estado=${estado}`, {
        method: "GET",
      });
      setRows((items ?? []).map((p) => ({ ...p, isActive: p.isActive ?? true })));
    } catch {
      setError("Error al cargar productos.");
    } finally {
      setLoading(false);
    }
  }, [call, estado]);

  React.useEffect(() => {
    load().catch(() => {});
  }, [load]);

  React.useEffect(() => {
    (async () => {
      try {
        const list = await call<Unidad[]>(`/api/unidades`, { method: "GET" });
        setUnidades((list ?? []).filter((u) => u.activo));
      } catch {
        setUnidades([]);
      }
    })();
  }, [call]);

  const [toast, setToast] = React.useState<{
    kind: "ok" | "err" | "warn";
    msg: string;
  } | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const [editModal, setEditModal] = React.useState<EditModalState>({
    open: false,
    nombre: "",
    descripcion: "",
    descuento: null,
    precioVenta: null,
    precioCosto: null,
    peso: null,
    largo: null,
    alto: null,
    ancho: null,
  });

  const [editErrors, setEditErrors] = React.useState<Record<string, string>>({});
  const [updating, setUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  const [confirmSaveOpen, setConfirmSaveOpen] = React.useState(false);

  const [confirmEstado, setConfirmEstado] = React.useState<{
    tipo: "inactivar" | "reactivar";
    row: Row;
  } | null>(null);

  const [detalleId, setDetalleId] = React.useState<number | null>(null);
  const [openEditarStock, setOpenEditarStock] = React.useState<{
    productoID: number;
    bodegaID?: number | null;
    productoNombre?: string;
  } | null>(null);

  const [filtroProductoId, setFiltroProductoId] =
    React.useState<number | "">(filtroId);

  React.useEffect(() => {
    setFiltroProductoId(filtroId);
  }, [filtroId]);

  const filtered = React.useMemo(() => {
    if (!rows || rows.length === 0) return [];
    if (filtroProductoId === "") return rows;
    const id = Number(filtroProductoId);
    return rows.filter((p) => p.productoID === id);
  }, [rows, filtroProductoId]);

  const parseNullableNumber = (value: string): number | null => {
    if (value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const toInputValue = (value: number | null | undefined): number | "" =>
    value == null ? "" : value;

  const clearEditError = (field: string) => {
    setEditErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const validateEditModal = () => {
    const e: Record<string, string> = {};

    if (!editModal.nombre.trim()) e.nombre = "El nombre es obligatorio.";

    if (editModal.descuento != null) {
      if (!Number.isFinite(Number(editModal.descuento))) {
        e.descuento = "Debe ser un número válido.";
      } else if (Number(editModal.descuento) < 0 || Number(editModal.descuento) > 100) {
        e.descuento = "Debe estar entre 0 y 100.";
      }
    }

    if (editModal.precioVenta == null || !Number.isFinite(Number(editModal.precioVenta))) {
      e.precioVenta = "El precio de venta es obligatorio.";
    } else if (Number(editModal.precioVenta) < 0) {
      e.precioVenta = "No puede ser negativo.";
    }

    const camposNoNegativos: Array<keyof EditModalState> = [
      "precioCosto",
      "peso",
      "largo",
      "alto",
      "ancho",
    ];

    camposNoNegativos.forEach((field) => {
      const value = editModal[field];
      if (value != null) {
        if (!Number.isFinite(Number(value))) {
          e[field] = "Debe ser un número válido.";
        } else if (Number(value) < 0) {
          e[field] = "No puede ser negativo.";
        }
      }
    });

    setEditErrors(e);
    return Object.keys(e).length === 0;
  };

  const openEdit = async (p: Row) => {
    setUpdateError(null);
    setEditErrors({});

    try {
      const loaded = await loadDetalle(p.productoID);
      const anyDet = (loaded as any) || {};

      setEditModal({
        open: true,
        id: p.productoID,
        nombre: p.nombre,
        descripcion: p.descripcion ?? anyDet.descripcion ?? "",
        descuento: p.descuento ?? 0,
        precioVenta: Number(anyDet.precioVenta ?? p.precioVenta ?? 0),
        sku: p.sku ?? null,
        codigoInterno: anyDet.codigoInterno ?? null,
        unidadAlmacenamientoID: anyDet.unidadAlmacenamientoID ?? null,
        precioCosto: anyDet.precioCosto ?? null,
        peso: anyDet.peso ?? null,
        largo: anyDet.largo ?? null,
        alto: anyDet.alto ?? null,
        ancho: anyDet.ancho ?? null,
      });
    } catch {
      setEditModal({
        open: true,
        id: p.productoID,
        nombre: p.nombre,
        descripcion: p.descripcion ?? "",
        descuento: p.descuento ?? 0,
        precioVenta: Number(p.precioVenta ?? 0),
        sku: p.sku ?? null,
        codigoInterno: null,
        unidadAlmacenamientoID: null,
        precioCosto: null,
        peso: null,
        largo: null,
        alto: null,
        ancho: null,
      });
    }
  };

  const closeEdit = () => {
    if (updating) return;
    setEditModal((m) => ({ ...m, open: false }));
    setEditErrors({});
    setUpdateError(null);
  };

  const doSave = async () => {
    if (!editModal.id) return;
    if (!validateEditModal()) {
      setUpdateError("Corrige los campos marcados antes de guardar.");
      setConfirmSaveOpen(false);
      return;
    }

    setUpdating(true);
    setUpdateError(null);

    const payload = {
      nombre: editModal.nombre.trim(),
      descripcion: editModal.descripcion.trim() || null,
      descuento: editModal.descuento ?? 0,
      precioVenta: editModal.precioVenta,
      sku: editModal.sku?.trim() || undefined,
      codigoInterno: editModal.codigoInterno?.trim() || undefined,
      unidadAlmacenamientoID: editModal.unidadAlmacenamientoID ?? null,
      precioCosto: editModal.precioCosto ?? null,
      peso: editModal.peso ?? null,
      largo: editModal.largo ?? null,
      alto: editModal.alto ?? null,
      ancho: editModal.ancho ?? null,
    };

    try {
      await call<void>(`/api/productos/${editModal.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setRows((prev) =>
        prev.map((r) =>
          r.productoID === editModal.id
            ? {
                ...r,
                nombre: payload.nombre,
                descripcion: payload.descripcion,
                descuento: payload.descuento,
                precioVenta: payload.precioVenta ?? r.precioVenta,
                sku: payload.sku ?? r.sku,
              }
            : r
        )
      );

      setToast({ kind: "ok", msg: "Producto actualizado correctamente." });
      setConfirmSaveOpen(false);
      closeEdit();
    } catch {
      setUpdateError("No se pudieron guardar los cambios.");
      setToast({ kind: "err", msg: "No se pudieron guardar los cambios." });
    } finally {
      setUpdating(false);
    }
  };

  const requestSave = () => {
    setUpdateError(null);
    if (!validateEditModal()) {
      setUpdateError("Corrige los campos marcados antes de guardar.");
      return;
    }
    setConfirmSaveOpen(true);
  };

  const doInactivar = async (row: Row) => {
    const result = await inactivar(row.productoID);
    if (!result.ok) throw new Error(result.message || "No se pudo inactivar.");
    await load();
    setToast({ kind: "ok", msg: `Producto "${row.nombre}" inactivado.` });
  };

  const doReactivar = async (row: Row) => {
    await call<void>(`/api/productos/${row.productoID}/activar`, {
      method: "POST",
    });
    await load();
    setToast({ kind: "ok", msg: `Producto "${row.nombre}" reactivado.` });
  };

  const handleConfirmEstado = async () => {
    if (!confirmEstado) return;
    const { tipo, row } = confirmEstado;
    try {
      if (tipo === "inactivar") {
        await doInactivar(row);
      } else {
        await doReactivar(row);
      }
    } catch {
      setToast({
        kind: "err",
        msg:
          tipo === "inactivar"
            ? `No se pudo inactivar el producto "${row.nombre}".`
            : `No se pudo reactivar el producto "${row.nombre}".`,
      });
    } finally {
      setConfirmEstado(null);
    }
  };

  const showDetalle = async (id: number) => {
    setDetalleId(id);
    const data = await loadDetalle(id);
    if (!data) {
      setToast({ kind: "warn", msg: "No se pudo cargar el detalle completo del producto." });
    }
  };

  const closeDetalle = () => setDetalleId(null);

  const abrirModalStock = (row: Row) =>
    setOpenEditarStock({
      productoID: row.productoID,
      productoNombre: row.nombre,
      bodegaID: null,
    });

  const editOverlay =
    typeof document !== "undefined" && editModal.open
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeEdit();
            }}
          >
            <div
              className="w-full max-w-6xl overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#151A1D_0%,#111417_100%)] p-5 text-white shadow-[0_25px_80px_rgba(0,0,0,.45)] md:p-6"
              onMouseDown={(e) => e.stopPropagation()}
              style={{ maxHeight: "88vh" }}
            >
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/6 pb-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Editar producto
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    Actualiza los datos del producto seleccionado.
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
                  onClick={closeEdit}
                  disabled={updating}
                >
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Nombre*" error={editErrors.nombre}>
                  <Input
                    value={editModal.nombre}
                    onChange={(e) => {
                      clearEditError("nombre");
                      setEditModal((v) => ({ ...v, nombre: e.target.value }));
                    }}
                  />
                </Field>

                <Field label="Descuento (%)" error={editErrors.descuento}>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={toInputValue(editModal.descuento)}
                    onChange={(e) => {
                      clearEditError("descuento");
                      setEditModal((v) => ({
                        ...v,
                        descuento: parseNullableNumber(e.target.value),
                      }));
                    }}
                  />
                </Field>

                <Field label="Precio venta*" error={editErrors.precioVenta}>
                  <Input
                    type="number"
                    step="0.01"
                    value={toInputValue(editModal.precioVenta)}
                    onChange={(e) => {
                      clearEditError("precioVenta");
                      setEditModal((v) => ({
                        ...v,
                        precioVenta: parseNullableNumber(e.target.value),
                      }));
                    }}
                  />
                </Field>

                <Field label="Precio costo" error={editErrors.precioCosto}>
                  <Input
                    type="number"
                    step="0.01"
                    value={toInputValue(editModal.precioCosto)}
                    onChange={(e) => {
                      clearEditError("precioCosto");
                      setEditModal((v) => ({
                        ...v,
                        precioCosto: parseNullableNumber(e.target.value),
                      }));
                    }}
                  />
                </Field>

                <Field label="SKU">
                  <Input
                    value={editModal.sku ?? ""}
                    onChange={(e) =>
                      setEditModal((v) => ({ ...v, sku: e.target.value }))
                    }
                  />
                </Field>

                <Field label="Código interno">
                  <Input
                    value={editModal.codigoInterno ?? ""}
                    onChange={(e) =>
                      setEditModal((v) => ({
                        ...v,
                        codigoInterno: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Unidad de almacenamiento">
                  <select
                    value={editModal.unidadAlmacenamientoID ?? ""}
                    onChange={(e) =>
                      setEditModal((v) => ({
                        ...v,
                        unidadAlmacenamientoID: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#1B2124] px-3.5 py-2.5 text-sm text-white shadow-inner outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
                  >
                    <option value="">— Seleccionar unidad —</option>
                    {unidades.map((u) => (
                      <option key={u.unidadID} value={u.unidadID}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Peso (kg)" error={editErrors.peso}>
                  <Input
                    type="number"
                    step="0.01"
                    value={toInputValue(editModal.peso)}
                    onChange={(e) => {
                      clearEditError("peso");
                      setEditModal((v) => ({
                        ...v,
                        peso: parseNullableNumber(e.target.value),
                      }));
                    }}
                  />
                </Field>

                <Field label="Largo (cm)" error={editErrors.largo}>
                  <Input
                    type="number"
                    step="0.01"
                    value={toInputValue(editModal.largo)}
                    onChange={(e) => {
                      clearEditError("largo");
                      setEditModal((v) => ({
                        ...v,
                        largo: parseNullableNumber(e.target.value),
                      }));
                    }}
                  />
                </Field>

                <Field label="Alto (cm)" error={editErrors.alto}>
                  <Input
                    type="number"
                    step="0.01"
                    value={toInputValue(editModal.alto)}
                    onChange={(e) => {
                      clearEditError("alto");
                      setEditModal((v) => ({
                        ...v,
                        alto: parseNullableNumber(e.target.value),
                      }));
                    }}
                  />
                </Field>

                <Field label="Ancho (cm)" error={editErrors.ancho}>
                  <Input
                    type="number"
                    step="0.01"
                    value={toInputValue(editModal.ancho)}
                    onChange={(e) => {
                      clearEditError("ancho");
                      setEditModal((v) => ({
                        ...v,
                        ancho: parseNullableNumber(e.target.value),
                      }));
                    }}
                  />
                </Field>

                <Field label="Descripción" full>
                  <Textarea
                    value={editModal.descripcion}
                    onChange={(e) =>
                      setEditModal((v) => ({
                        ...v,
                        descripcion: e.target.value,
                      }))
                    }
                    className="min-h-[96px]"
                  />
                </Field>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-white/6 pt-5">
                <button
                  type="button"
                  className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                  onClick={closeEdit}
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-xl bg-[#A30862] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(163,8,98,.22)] transition hover:opacity-95 disabled:opacity-60"
                  onClick={requestSave}
                  disabled={updating}
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const detalleOverlay =
    typeof document !== "undefined" && detalleId !== null
      ? createPortal(
          <div
            className="fixed inset-0 z-[9500] flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 pt-20 pb-8 sm:px-8"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDetalle();
            }}
          >
            <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#111417_0%,#0B0E10_100%)] shadow-[0_25px_80px_rgba(0,0,0,.45)]">
              <div
                className="flex items-center justify-between gap-4 px-6 py-5"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(163,8,98,0.24) 0%, rgba(163,8,98,0.08) 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {(() => {
                  const currentRow = rows.find((r) => r.productoID === detalleId);
                  const d = (detalle as any) ?? {};
                  const merged = {
                    nombre: currentRow?.nombre ?? d.nombre,
                    sku: currentRow?.sku ?? d.sku,
                    descripcion: currentRow?.descripcion ?? d.descripcion,
                    descuento: currentRow?.descuento ?? d.descuento ?? 0,
                    precioVenta: d.precioVenta ?? currentRow?.precioVenta,
                    codigoInterno: d.codigoInterno,
                    precioCosto: d.precioCosto,
                    peso: d.peso,
                    largo: d.largo,
                    alto: d.alto,
                    ancho: d.ancho,
                    unidadAlmacenamientoID:
                      d.unidadAlmacenamientoID as number | undefined,
                    activo: currentRow?.isActive ?? true,
                  };

                  const unidadNombreDetalle =
                    unidadNombre(merged.unidadAlmacenamientoID) ?? "—";

                  return (
                    <>
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-semibold text-white">
                          {merged.nombre ?? "Detalle del producto"}
                        </h3>
                        <p className="mt-1 text-sm text-white/70">
                          SKU: {merged.sku ?? "—"} · Unidad:{" "}
                          {unidadNombreDetalle}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {merged.precioVenta != null && (
                          <span className="rounded-full border border-white/15 bg-white/7 px-3 py-1 text-sm text-white">
                            Precio: ₡
                            {Number(merged.precioVenta).toLocaleString()}
                          </span>
                        )}
                        <span
                          className={
                            "rounded-full px-3 py-1 text-sm font-medium " +
                            (merged.activo
                              ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                              : "border border-rose-400/30 bg-rose-400/10 text-rose-200")
                          }
                        >
                          {merged.activo ? "Activo" : "Inactivo"}
                        </span>

                        <button
                          onClick={closeDetalle}
                          className="rounded-full px-2 py-1 text-lg leading-none text-white/80 transition hover:bg-white/10"
                          aria-label="Cerrar"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
                <div className="rounded-2xl border border-white/10 bg-[#0F1315] p-5 shadow-sm">
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/85">
                    Información básica
                  </h4>
                  {(() => {
                    const currentRow = rows.find((r) => r.productoID === detalleId);
                    const d = (detalle as any) ?? {};
                    const merged = {
                      descripcion: currentRow?.descripcion ?? d.descripcion,
                      codigoInterno: d.codigoInterno,
                    };
                    return (
                      <>
                        <Info label="Código interno" value={merged.codigoInterno} />
                        <Info
                          label="Descripción"
                          value={merged.descripcion ?? "—"}
                          full
                        />
                      </>
                    );
                  })()}
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0F1315] p-5 shadow-sm">
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/85">
                    Precios
                  </h4>
                  {(() => {
                    const currentRow = rows.find((r) => r.productoID === detalleId);
                    const d = (detalle as any) ?? {};
                    const merged = {
                      precioCosto: d.precioCosto,
                      precioVenta: d.precioVenta ?? currentRow?.precioVenta,
                      descuento: currentRow?.descuento ?? d.descuento ?? 0,
                    };
                    return (
                      <>
                        <Info label="Precio costo" value={merged.precioCosto} />
                        <Info label="Precio venta" value={merged.precioVenta} />
                        <Info label="Descuento (%)" value={merged.descuento} />
                      </>
                    );
                  })()}
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0F1315] p-5 shadow-sm">
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/85">
                    Dimensiones &amp; peso
                  </h4>
                  <Info label="Peso (kg)" value={(detalle as any)?.peso} />
                  <Info label="Largo (cm)" value={(detalle as any)?.largo} />
                  <Info label="Alto (cm)" value={(detalle as any)?.alto} />
                  <Info label="Ancho (cm)" value={(detalle as any)?.ancho} />
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0F1315] p-5 shadow-sm">
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/85">
                    Almacenamiento
                  </h4>
                  {(() => {
                    const d = (detalle as any) ?? {};
                    const name = unidadNombre(d.unidadAlmacenamientoID) ?? "—";
                    return <Info label="Unidad" value={name} />;
                  })()}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="mt-1">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-[#101417] px-4 py-3">
        <label className="text-sm font-medium text-white/85">
          Filtrar por producto:
        </label>
        <ProductoFiltroDropdown
          value={filtroProductoId}
          onChange={setFiltroProductoId}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-[#101417] px-4 py-3">
        <label className="text-sm font-medium text-white/85">Mostrar:</label>
        <EstadoDropdown value={estado} onChange={setEstado} />
        <button
          onClick={() => load()}
          className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Recargar
        </button>
      </div>

      {toast && (
        <div
          className={[
            "mb-3 rounded-2xl px-4 py-3 text-sm shadow-sm",
            toast.kind === "ok"
              ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : toast.kind === "warn"
              ? "border border-amber-400/30 bg-amber-400/10 text-amber-200"
              : "border border-rose-400/30 bg-rose-400/10 text-rose-200",
          ].join(" ")}
        >
          {toast.msg}
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 shadow-sm">
          {error}
        </div>
      )}

      {updateError && (
        <div className="mb-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 shadow-sm">
          {updateError}
        </div>
      )}

      <div className="mt-2 overflow-hidden rounded-[26px] border border-white/10 bg-[#111518] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#1A2023]">
                <Th>SKU</Th>
                <Th>Nombre</Th>
                <Th>Descripción</Th>
                <Th>Descuento (%)</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
                <Th>Detalles</Th>
              </tr>
            </thead>

            <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/5">
              {loading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-5 text-center text-sm text-[#8B9AA0]"
                  >
                    Cargando…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-5 text-center text-sm text-[#8B9AA0]"
                  >
                    No hay productos.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const activo = p.isActive ?? true;
                  return (
                    <tr key={p.productoID} className="transition hover:bg-white/[0.04]">
                      <Td className="font-mono text-[#E6E9EA]/80">
                        {p.sku ?? "—"}
                      </Td>
                      <Td strong>
                        <span className="font-medium text-white">
                          {p.nombre}
                        </span>
                      </Td>
                      <Td>
                        <span className="line-clamp-2 text-[#E6E9EA]/80">
                          {p.descripcion ?? "—"}
                        </span>
                      </Td>
                      <Td>
                        <PillBadge variant={p.descuento ? "warning" : "default"}>
                          {p.descuento ?? 0}%
                        </PillBadge>
                      </Td>

                      <Td>
                        {activo ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-200">
                            Inactivo
                          </span>
                        )}
                      </Td>

                      <Td>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                          >
                            Editar
                          </button>

                          {activo ? (
                            <button
                              onClick={() =>
                                setConfirmEstado({
                                  tipo: "inactivar",
                                  row: p,
                                })
                              }
                              className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-white transition"
                              style={{
                                backgroundColor: `${WINE}1A`,
                                borderColor: `${WINE}4D`,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${WINE}33`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = `${WINE}1A`;
                              }}
                            >
                              Inactivar
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setConfirmEstado({
                                  tipo: "reactivar",
                                  row: p,
                                })
                              }
                              className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-white transition"
                              style={{
                                backgroundColor: `${WINE}1A`,
                                borderColor: `${WINE}4D`,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${WINE}33`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = `${WINE}1A`;
                              }}
                            >
                              Reactivar
                            </button>
                          )}

                          <button
                            onClick={() => abrirModalStock(p)}
                            className="rounded-xl border px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/8"
                            style={{
                              backgroundColor: `${WINE}14`,
                              borderColor: "rgba(255,255,255,0.12)",
                            }}
                          >
                            Editar stock
                          </button>
                        </div>
                      </Td>

                      <Td>
                        <button
                          onClick={() => showDetalle(p.productoID)}
                          className="rounded-xl border px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/8"
                          style={{
                            backgroundColor: `${WINE}14`,
                            borderColor: "rgba(255,255,255,0.12)",
                          }}
                        >
                          Ver detalle
                        </button>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmSaveOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmSaveOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#151A1D_0%,#111417_100%)] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,.45)]">
            <h3 className="mb-2 text-lg font-semibold">Confirmar guardado</h3>
            <p className="mb-5 text-sm leading-6 text-white/75">
              ¿Deseas guardar los cambios realizados en este producto?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10"
                onClick={() => setConfirmSaveOpen(false)}
              >
                No, volver
              </button>
              <button
                type="button"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: WINE }}
                onClick={doSave}
                disabled={updating}
              >
                {updating ? "Guardando…" : "Sí, guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmEstado && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmEstado(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#151A1D_0%,#111417_100%)] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,.45)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-semibold">
              {confirmEstado.tipo === "inactivar"
                ? "Inactivar producto"
                : "Reactivar producto"}
            </h3>
            <p className="mb-5 text-sm leading-6 text-white/75">
              {confirmEstado.tipo === "inactivar"
                ? `¿Seguro que deseas inactivar el producto "${confirmEstado.row.nombre}"?`
                : `¿Seguro que deseas reactivar el producto "${confirmEstado.row.nombre}"?`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10"
                onClick={() => setConfirmEstado(null)}
              >
                No, volver
              </button>
              <button
                type="button"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: WINE }}
                onClick={handleConfirmEstado}
              >
                {confirmEstado.tipo === "inactivar"
                  ? "Sí, inactivar"
                  : "Sí, reactivar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {openEditarStock !== null && (
        <EditarCantidadModal
          open={openEditarStock !== null}
          onClose={() => setOpenEditarStock(null)}
          productoID={openEditarStock.productoID}
          productoNombre={openEditarStock.productoNombre ?? ""}
          bodegas={bodegas}
          initialBodegaID={openEditarStock.bodegaID ?? null}
          onSaved={async () => {
            await load();
            setOpenEditarStock(null);
          }}
        />
      )}

      {editOverlay}
      {detalleOverlay}
    </div>
  );
}

const Info: React.FC<{ label: string; value: any; full?: boolean }> = ({
  label,
  value,
  full = false,
}) => (
  <div className={["space-y-1 py-2", full ? "col-span-2" : ""].join(" ")}>
    <p className="text-xs font-medium uppercase tracking-wide text-[#8B9AA0]">
      {label}
    </p>
    <p className="text-sm leading-6 text-white">{value ?? "—"}</p>
  </div>
);

const Field: React.FC<
  React.PropsWithChildren<{ label: string; full?: boolean; error?: string }>
> = ({ label, full, error, children }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <div className="mb-1.5 text-xs font-medium tracking-wide text-white/72">
      {label}
    </div>
    {children}
    {error ? <div className="mt-1.5 text-xs text-rose-300">{error}</div> : null}
  </div>
);

const baseInput =
  "w-full rounded-2xl border border-white/10 bg-[#1B2124] px-3.5 py-2.5 text-sm text-white shadow-inner outline-none transition " +
  "focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40 placeholder:text-white/40";

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props
) => (
  <input {...props} className={[baseInput, props.className ?? ""].join(" ")} />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (
  props
) => (
  <textarea
    {...props}
    className={["min-h-[110px]", baseInput, props.className ?? ""].join(" ")}
  />
);

const estadoLabels: Record<EstadoFiltro, string> = {
  activos: "Activos",
  inactivos: "Inactivos",
  todos: "Todos",
};

const EstadoDropdown: React.FC<{
  value: EstadoFiltro;
  onChange: (v: EstadoFiltro) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (v: EstadoFiltro) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-[160px] items-center justify-between rounded-2xl border border-white/10 bg-[#111518] px-3.5 py-2.5 text-sm text-white outline-none transition hover:border-white/20 hover:bg-[#151A1D]"
      >
        <span>{estadoLabels[value]}</span>
        <span className="ml-2 text-white/60">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full min-w-[160px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e10] p-1 shadow-[0_18px_40px_rgba(0,0,0,.45)]">
          {(["activos", "inactivos", "todos"] as EstadoFiltro[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                opt === value
                  ? "bg-[#1c2224] text-white font-medium"
                  : "bg-[#0b0e10] text-white/80 hover:bg-[#1c2224] hover:text-white"
              }`}
            >
              {estadoLabels[opt]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

type PillVariant = "success" | "danger" | "warning" | "default";

const PillBadge: React.FC<
  React.PropsWithChildren<{ variant?: PillVariant }>
> = ({ variant = "default", children }) => {
  const map: Record<PillVariant, string> = {
    success: "border-lime-400/40 text-lime-300 bg-lime-400/5",
    danger: "border-rose-400/40 text-rose-300 bg-rose-400/5",
    warning: "border-amber-400/40 text-amber-300 bg-amber-400/5",
    default: "border-white/15 text-[#8B9AA0] bg-white/5",
  };
  return (
    <span
      className={[
        "inline-flex h-7 items-center justify-center rounded-full px-3",
        "text-xs font-medium whitespace-nowrap border",
        map[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
};

const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <th
    className={[
      "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#91A1A8]",
      className,
    ].join(" ")}
  >
    {children}
  </th>
);

const Td: React.FC<
  React.PropsWithChildren<{
    className?: string;
    strong?: boolean;
  }>
> = ({ className = "", strong = false, children }) => (
  <td
    className={[
      "px-4 py-3 align-middle text-sm",
      strong ? "font-semibold text-white" : "text-[#E6E9EA]",
      className,
    ].join(" ")}
  >
    {children}
  </td>
);