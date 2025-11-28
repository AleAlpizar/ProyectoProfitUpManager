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
      setRows(items.map((p) => ({ ...p, isActive: p.isActive ?? true })));
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
      } catch {}
    })();
  }, [call]);

  const [toast, setToast] = React.useState<{
    kind: "ok" | "err" | "warn";
    msg: string;
  } | null>(null);

  const [editModal, setEditModal] = React.useState<{
    open: boolean;
    id?: number;
    nombre: string;
    descripcion: string;
    descuento: number;
    precioVenta: number;
    sku?: string | null;
    codigoInterno?: string | null;
    unidadAlmacenamientoID?: number | null;
    precioCosto?: number | null;
    peso?: number | null;
    largo?: number | null;
    alto?: number | null;
    ancho?: number | null;
  }>({
    open: false,
    nombre: "",
    descripcion: "",
    descuento: 0,
    precioVenta: 0,
  });

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

  const openEdit = async (p: Row) => {
    try {
      await loadDetalle(p.productoID);
      const anyDet = (detalle as any) || {};
      setEditModal({
        open: true,
        id: p.productoID,
        nombre: p.nombre,
        descripcion: p.descripcion ?? "",
        descuento: p.descuento ?? 0,
        precioVenta: Number(p.precioVenta ?? anyDet.precioVenta ?? 0) || 0,
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
        precioVenta: Number(p.precioVenta ?? 0) || 0,
        sku: p.sku ?? null,
      });
    }
  };
  const closeEdit = () => setEditModal((m) => ({ ...m, open: false }));

  const doSave = async () => {
    if (!editModal.id) return;
    setUpdating(true);
    setUpdateError(null);

    const payload = {
      nombre: editModal.nombre.trim(),
      descripcion: editModal.descripcion.trim(),
      descuento: editModal.descuento ?? 0,
      precioVenta: editModal.precioVenta,
      sku: editModal.sku ?? undefined,
      codigoInterno: editModal.codigoInterno ?? undefined,
      unidadAlmacenamientoID: editModal.unidadAlmacenamientoID,
      precioCosto: editModal.precioCosto,
      peso: editModal.peso,
      largo: editModal.largo,
      alto: editModal.alto,
      ancho: editModal.ancho,
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
                nombre: editModal.nombre,
                descripcion: editModal.descripcion,
                descuento: editModal.descuento,
                precioVenta: editModal.precioVenta,
                sku: editModal.sku ?? r.sku,
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

  const requestSave = () => setConfirmSaveOpen(true);

  const doInactivar = async (row: Row) => {
    const { ok } = await inactivar(row.productoID);
    if (!ok) throw new Error();
    setRows((prev) =>
      prev.map((r) =>
        r.productoID === row.productoID ? { ...r, isActive: false } : r
      )
    );
    setToast({ kind: "ok", msg: `Producto "${row.nombre}" inactivado.` });
  };

  const doReactivar = async (row: Row) => {
    await call<void>(`/api/productos/${row.productoID}/activar`, {
      method: "POST",
    });
    setRows((prev) =>
      prev.map((r) =>
        r.productoID === row.productoID ? { ...r, isActive: true } : r
      )
    );
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
    await loadDetalle(id);
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeEdit();
            }}
          >
            <div
              className="w-full max-w-6xl rounded-2xl border border-white/10 bg-[#121618] p-5 text-white shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
              style={{ maxHeight: "86vh" }}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Editar producto</h2>
                <button
                  type="button"
                  className="rounded-xl bg-[#A30862] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95"
                  onClick={closeEdit}
                >
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Nombre*">
                  <Input
                    value={editModal.nombre}
                    onChange={(e) =>
                      setEditModal((v) => ({ ...v, nombre: e.target.value }))
                    }
                  />
                </Field>

                <Field label="Descuento (%)">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={editModal.descuento ?? 0}
                    onChange={(e) =>
                      setEditModal((v) => ({
                        ...v,
                        descuento: Number(e.target.value),
                      }))
                    }
                  />
                </Field>

                <Field label="Precio venta*">
                  <Input
                    type="number"
                    step="0.01"
                    value={editModal.precioVenta ?? 0}
                    onChange={(e) =>
                      setEditModal((v) => ({
                        ...v,
                        precioVenta: Number(e.target.value),
                      }))
                    }
                  />
                </Field>

                <Field label="Precio costo">
                  <Input
                    type="number"
                    step="0.01"
                    value={editModal.precioCosto ?? 0}
                    onChange={(e) =>
                      setEditModal((v) => ({
                        ...v,
                        precioCosto: Number(e.target.value),
                      }))
                    }
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
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-[#A30862]/40"
                  >
                    <option value="">— Seleccionar unidad —</option>
                    {unidades.map((u) => (
                      <option key={u.unidadID} value={u.unidadID}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Peso (kg)">
                  <Input
                    type="number"
                    step="0.01"
                    value={editModal.peso ?? 0}
                    onChange={(e) =>
                      setEditModal((v) => ({
                        ...v,
                        peso: Number(e.target.value),
                      }))
                    }
                  />
                </Field>

                <Field label="Largo (cm)">
                  <Input
                    type="number"
                    step="0.01"
                    value={editModal.largo ?? 0}
                    onChange={(e) =>
                      setEditModal((v) => ({
                        ...v,
                        largo: Number(e.target.value),
                      }))
                    }
                  />
                </Field>

                <Field label="Alto (cm)">
                  <Input
                    type="number"
                    step="0.01"
                    value={editModal.alto ?? 0}
                    onChange={(e) =>
                      setEditModal((v) => ({
                        ...v,
                        alto: Number(e.target.value),
                      }))
                    }
                  />
                </Field>

                <Field label="Ancho (cm)">
                  <Input
                    type="number"
                    step="0.01"
                    value={editModal.ancho ?? 0}
                    onChange={(e) =>
                      setEditModal((v) => ({
                        ...v,
                        ancho: Number(e.target.value),
                      }))
                    }
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
                    className="min-h-[92px]"
                  />
                </Field>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                  onClick={closeEdit}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-xl bg-[#A30862] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
                  onClick={requestSave}
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
            className="fixed inset-0 z-[9500] flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 sm:px-10 pt-24 pb-8"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDetalle();
            }}
          >
            <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E10] shadow-2xl">
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(163,8,98,0.25) 0%, rgba(163,8,98,0.08) 100%)",
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
                      (d.unidadAlmacenamientoID as number | undefined),
                    activo: currentRow?.isActive ?? true,
                  };

                  const unidadNombreDetalle =
                    unidadNombre(merged.unidadAlmacenamientoID) ?? "—";

                  return (
                    <>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {merged.nombre ?? "Detalle del producto"}
                        </h3>
                        <p className="text-sm text-white/70">
                          SKU: {merged.sku ?? "—"} · Unidad:{" "}
                          {unidadNombreDetalle}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {merged.precioVenta != null && (
                          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white">
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
                          className="rounded-full px-2 text-white/80 hover:bg-white/10"
                          aria-label="Cerrar"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#0f1214] p-5">
                  <h4 className="mb-3 text-sm font-semibold text-white">
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

                <div className="rounded-2xl border border-white/10 bg-[#0f1214] p-5">
                  <h4 className="mb-3 text-sm font-semibold text-white">
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

                <div className="rounded-2xl border border-white/10 bg-[#0f1214] p-5">
                  <h4 className="mb-3 text-sm font-semibold text-white">
                    Dimensiones &amp; peso
                  </h4>
                  <Info label="Peso (kg)" value={(detalle as any)?.peso} />
                  <Info label="Largo (cm)" value={(detalle as any)?.largo} />
                  <Info label="Alto (cm)" value={(detalle as any)?.alto} />
                  <Info label="Ancho (cm)" value={(detalle as any)?.ancho} />
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0f1214] p-5">
                  <h4 className="mb-3 text-sm font-semibold text-white">
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
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <label className="text-sm text-white/80">Filtrar por producto:</label>
        <ProductoFiltroDropdown
          value={filtroProductoId}
          onChange={setFiltroProductoId}
        />
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label className="text-sm text-white/80">Mostrar:</label>
        <EstadoDropdown value={estado} onChange={setEstado} />
        <button
          onClick={() => load()}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          Recargar
        </button>
      </div>

      {toast && (
        <div
          className={[
            "mb-3 rounded-xl px-4 py-2 text-sm",
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
        <div className="mb-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
      {updateError && (
        <div className="mb-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
          {updateError}
        </div>
      )}

      <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#111518] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#1C2224]">
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
                  className="px-4 py-3 text-center text-[#8B9AA0]"
                >
                  Cargando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-3 text-center text-[#8B9AA0]"
                >
                  No hay productos.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const activo = p.isActive ?? true;
                return (
                  <tr key={p.productoID} className="hover:bg-white/5">
                    <Td className="font-mono text-[#E6E9EA]/80">
                      {p.sku ?? "—"}
                    </Td>
                    <Td strong>
                      <span className="font-medium text-white">
                        {p.nombre}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-[#E6E9EA]/80">
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
                          className="rounded-xl border px-3 py-1.5 text-xs font-medium text-white transition"
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
                        className="rounded-xl border px-3 py-1.5 text-xs font-medium text-white transition"
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

      {confirmSaveOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmSaveOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121618] p-5 text-white shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold">Confirmar guardado</h3>
            <p className="mb-5 text-sm text-white/80">
              ¿Deseas guardar los cambios realizados en este producto?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                onClick={() => setConfirmSaveOpen(false)}
              >
                No, volver
              </button>
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmEstado(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121618] p-5 text-white shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-semibold">
              {confirmEstado.tipo === "inactivar"
                ? "Inactivar producto"
                : "Reactivar producto"}
            </h3>
            <p className="mb-5 text-sm text-white/80">
              {confirmEstado.tipo === "inactivar"
                ? `¿Seguro que deseas inactivar el producto "${confirmEstado.row.nombre}"?`
                : `¿Seguro que deseas reactivar el producto "${confirmEstado.row.nombre}"?`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                onClick={() => setConfirmEstado(null)}
              >
                No, volver
              </button>
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
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
  <p className={full ? "col-span-2" : ""}>
    <span className="text-[#8B9AA0]">{label}:</span>{" "}
    <span className="text-white">{value ?? "—"}</span>
  </p>
);

const Field: React.FC<
  React.PropsWithChildren<{ label: string; full?: boolean }>
> = ({ label, full, children }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <div className="mb-1 text-xs text-white/70">{label}</div>
    {children}
  </div>
);

const baseInput =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition " +
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
        className="flex min-w-[150px] items-center justify-between rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2 text-sm text-white outline-none hover:border-white/20"
      >
        <span>{estadoLabels[value]}</span>
        <span className="ml-2 text-white/60">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[150px] overflow-hidden rounded-xl border border-white/10 bg-[#0b0e10] shadow-xl">
          {(["activos", "inactivos", "todos"] as EstadoFiltro[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className={`block w-full px-3 py-2 text-left text-sm ${
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
      "px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8B9AA0]",
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
      "px-4 py-2 text-sm",
      strong ? "font-semibold text-white" : "text-[#E6E9EA]",
      className,
    ].join(" ")}
  >
    {children}
  </td>
);
