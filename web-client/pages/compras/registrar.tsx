"use client";

import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import Button from "@/components/buttons/button";
import { Th, Td } from "../../components/ui/table";
import { useApi } from "@/components/hooks/useApi";
import { formatMoney } from "@/helpers/ui-helpers";
import { useRouter } from "next/router";

type Proveedor = {
  proveedorID: number;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
};

type ProductoMini = {
  productoID: number;
  sku: string | null;
  nombre: string;
  descripcion: string | null;
};

type Line = {
  lineId: string;
  productoSku: string;
  cantidad: number | "";
  precioUnitario: number | "";
};

export default function RegistrarOrdenCompraPage() {
  const { call } = useApi();
  const router = useRouter();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<ProductoMini[]>([]);
  const [proveedorSelectedId, setProveedorSelectedId] = useState<number | "">(
    ""
  );

  const [fechaEstimada, setFechaEstimada] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingCatalogs(true);
        setErrorMsg(null);

        const [provData, prodData] = await Promise.all([
          call<Proveedor[]>("/api/proveedores", {
            method: "GET",
          }),
          call<ProductoMini[]>("/api/productos/mini", {
            method: "GET",
          }),
        ]);

        if (!alive) return;

        setProveedores(provData ?? []);
        setProductos(
          (prodData ?? []).map((p) => ({
            productoID: p.productoID,
            sku: p.sku,
            nombre: p.nombre,
            descripcion: p.descripcion,
          }))
        );
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(
          e?.message ?? "No se pudieron cargar proveedores o productos."
        );
      } finally {
        if (!alive) return;
        setLoadingCatalogs(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [call]);

  const proveedorSelected = useMemo(
    () =>
      proveedores.find((p) => p.proveedorID === proveedorSelectedId) ??
      undefined,
    [proveedores, proveedorSelectedId]
  );

  const patchLine = (lineId: string, patch: Partial<Line>) => {
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l))
    );
  };

  const addLine = () => {
    setErrorMsg(null);
    setLines((prev) => [
      ...prev,
      {
        lineId: crypto.randomUUID(),
        productoSku: "",
        cantidad: 1,
        precioUnitario: "",
      },
    ]);
  };

  const removeLine = (lineId: string) => {
    setErrorMsg(null);
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  };

  const getProductoBySku = (sku: string) =>
    productos.find((p) => p.sku === sku);

  const handleProductChange =
    (lineId: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const sku = e.target.value;
      setErrorMsg(null);

      patchLine(lineId, {
        productoSku: sku,
      });
    };

  const handleCantidadChange = (lineId: string, rawValue: string) => {
    setErrorMsg(null);

    if (rawValue === "") {
      patchLine(lineId, { cantidad: "" });
      return;
    }

    const parsed = Number(rawValue);
    patchLine(lineId, {
      cantidad: Number.isNaN(parsed) ? "" : parsed,
    });
  };

  const handlePrecioChange = (lineId: string, rawValue: string) => {
    setErrorMsg(null);

    if (rawValue === "") {
      patchLine(lineId, { precioUnitario: "" });
      return;
    }

    const parsed = Number(rawValue);
    patchLine(lineId, {
      precioUnitario: Number.isNaN(parsed) ? "" : parsed,
    });
  };

  const lineSubtotal = (line: Line) => {
    const qty =
      typeof line.cantidad === "number" && line.cantidad > 0
        ? line.cantidad
        : 0;

    const price =
      typeof line.precioUnitario === "number" && line.precioUnitario > 0
        ? line.precioUnitario
        : 0;

    return qty * price;
  };

  const subtotal = lines.reduce((acc, line) => acc + lineSubtotal(line), 0);

  function validateBeforePost() {
    if (!proveedorSelected?.proveedorID) {
      return "Selecciona un proveedor.";
    }

    if (lines.length === 0) {
      return "Agrega al menos un producto.";
    }

    if (fechaEstimada) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const estimada = new Date(`${fechaEstimada}T00:00:00`);
      if (estimada < hoy) {
        return "La fecha estimada no puede ser menor a la fecha actual.";
      }
    }

    const selectedSkus = lines
      .map((l) => l.productoSku.trim())
      .filter(Boolean);

    const duplicatedSkus = selectedSkus.filter(
      (sku, index) => selectedSkus.indexOf(sku) !== index
    );

    if (duplicatedSkus.length > 0) {
      return `No puedes repetir productos en la misma orden. SKU duplicados: ${Array.from(
        new Set(duplicatedSkus)
      ).join(", ")}.`;
    }

    for (const l of lines) {
      if (!l.productoSku.trim()) {
        return "Hay una línea sin producto seleccionado.";
      }

      if (l.cantidad === "" || Number(l.cantidad) <= 0) {
        return "Hay una línea con cantidad inválida.";
      }

      if (
        l.precioUnitario !== "" &&
        (Number.isNaN(Number(l.precioUnitario)) ||
          Number(l.precioUnitario) <= 0)
      ) {
        return "Hay una línea con precio unitario inválido.";
      }
    }

    if (notes.trim().length > 500) {
      return "Las observaciones no pueden superar los 500 caracteres.";
    }

    return null;
  }

  const guardarOrden = async () => {
    const validationMsg = validateBeforePost();

    if (validationMsg) {
      setErrorMsg(validationMsg);
      setShowConfirm(false);
      return;
    }

    const payload = {
      proveedorID: proveedorSelected!.proveedorID,
      fechaEstimada: fechaEstimada || undefined,
      observaciones: notes.trim() || undefined,
      lineas: lines.map((l) => ({
        sku: l.productoSku.trim(),
        cantidad: Number(l.cantidad),
        precioUnitario:
          typeof l.precioUnitario === "number" && l.precioUnitario > 0
            ? Number(l.precioUnitario)
            : undefined,
      })),
    };

    try {
      setSaving(true);
      setErrorMsg(null);

      const res = await call<{ ordenCompraID: number; message?: string }>(
        "/api/ordenes-compra",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (res?.ordenCompraID) {
        router.replace(`/compras/${res.ordenCompraID}?created=1`);
        return;
      }

      setErrorMsg("La orden se registró, pero no se pudo abrir el detalle.");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "No se pudo registrar la orden de compra.");
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  const confirmMessage = useMemo(() => {
    const proveedorNombre = proveedorSelected?.nombre ?? "—";
    return `¿Deseas registrar esta orden de compra?\n\nProveedor: ${proveedorNombre}\nProductos: ${lines.length}\nTotal estimado ingresado: ${formatMoney(
      subtotal
    )}\n\nSi dejas precios vacíos, el backend intentará usar el precio de costo del producto.`;
  }, [proveedorSelected?.nombre, lines.length, subtotal]);

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-5">
        <SectionHeader
          title="Registrar orden de compra"
          subtitle="Selecciona proveedor y productos a solicitar"
        />
      </div>

      <section className="mb-6 rounded-3xl border border-white/10 bg-[#13171A] p-4 shadow-[0_18px_50px_rgba(0,0,0,.28)] md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label>Proveedor</Label>
            <select
              className="w-full rounded-2xl border border-white/10 bg-[#121618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
              style={{ colorScheme: "dark" }}
              value={proveedorSelectedId}
              onChange={(e) => {
                setErrorMsg(null);
                setProveedorSelectedId(
                  e.target.value ? Number(e.target.value) : ""
                );
              }}
              disabled={loadingCatalogs || saving}
            >
              <option value="" className="bg-[#121618] text-white">
                Selecciona un proveedor
              </option>
              {proveedores.map((p) => (
                <option
                  key={p.proveedorID}
                  value={p.proveedorID}
                  className="bg-[#121618] text-white"
                >
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Fecha estimada</Label>
            <input
              type="date"
              value={fechaEstimada}
              onChange={(e) => {
                setErrorMsg(null);
                setFechaEstimada(e.target.value);
              }}
              disabled={saving}
              className="w-full rounded-2xl border border-white/10 bg-[#121618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <Label>Observaciones</Label>
            <textarea
              placeholder="Opcional"
              value={notes}
              onChange={(e) => {
                setErrorMsg(null);
                setNotes(e.target.value);
              }}
              disabled={saving}
              rows={2}
              className="w-full resize-none rounded-2xl border border-white/10 bg-[#121618] px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#13171A] shadow-[0_18px_50px_rgba(0,0,0,.22)]">
        <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white/95">
              Productos solicitados
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              Puedes dejar el precio vacío y el sistema intentará usar el precio
              de costo del producto.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            className="!rounded-2xl !bg-[#A30862] hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40"
            onClick={addLine}
            disabled={loadingCatalogs || saving}
          >
            + Agregar producto
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#1B2025] text-left text-xs uppercase tracking-wide text-white/60">
                <Th>Producto</Th>
                <Th>Cant.</Th>
                <Th>Precio unit.</Th>
                <Th>Subtotal</Th>
                <Th className="text-right">—</Th>
              </tr>
            </thead>

            {lines.length > 0 ? (
              <tbody className="divide-y divide-white/10">
                {lines.map((line) => {
                  const producto = getProductoBySku(line.productoSku);

                  return (
                    <tr
                      key={line.lineId}
                      className="align-top transition hover:bg-white/[0.04]"
                    >
                      <Td>
                        <div className="min-w-[260px]">
                          <select
                            className="w-full rounded-2xl border border-white/10 bg-[#121618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                            style={{ colorScheme: "dark" }}
                            value={line.productoSku}
                            onChange={handleProductChange(line.lineId)}
                            disabled={saving}
                          >
                            <option value="" className="bg-[#121618] text-white">
                              Selecciona producto
                            </option>
                            {productos.map((p) => (
                              <option
                                key={p.sku ?? String(p.productoID)}
                                value={p.sku ?? ""}
                                className="bg-[#121618] text-white"
                              >
                                {p.nombre} - {p.sku}
                              </option>
                            ))}
                          </select>

                          {producto?.descripcion ? (
                            <div className="mt-2 max-w-[420px] text-xs leading-relaxed text-white/50">
                              {producto.descripcion}
                            </div>
                          ) : null}
                        </div>
                      </Td>

                      <Td>
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={line.cantidad}
                          onChange={(e) =>
                            handleCantidadChange(line.lineId, e.target.value)
                          }
                          disabled={saving}
                          className="w-24 rounded-2xl border border-white/10 bg-[#121618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                        />
                      </Td>

                      <Td>
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={line.precioUnitario}
                          onChange={(e) =>
                            handlePrecioChange(line.lineId, e.target.value)
                          }
                          disabled={saving}
                          placeholder="Auto"
                          className="w-32 rounded-2xl border border-white/10 bg-[#121618] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/20"
                        />
                      </Td>

                      <Td>
                        <span className="font-semibold text-white">
                          {formatMoney(lineSubtotal(line))}
                        </span>
                      </Td>

                      <Td className="text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(line.lineId)}
                          disabled={saving}
                          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Quitar
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-white/45"
                  >
                    <div className="mx-auto max-w-md">
                      <div className="mb-1 text-base font-medium text-white/80">
                        Aún no hay productos
                      </div>
                      <div>Agrega un producto para iniciar la orden.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {lines.length > 0 && (
          <div className="border-t border-white/10 px-4 py-4">
            <div className="flex flex-col items-end gap-1">
              <div className="text-xs uppercase tracking-wide text-white/45">
                Total estimado
              </div>
              <div className="text-2xl font-bold text-white">
                {formatMoney(subtotal)}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-4">
          <Button
            type="button"
            variant="primary"
            className="!rounded-2xl !bg-[#A30862] hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40 disabled:!opacity-60"
            disabled={lines.length === 0 || saving || loadingCatalogs}
            onClick={() => setShowConfirm(true)}
          >
            {saving ? "Guardando…" : "Registrar orden"}
          </Button>
        </div>
      </section>

      {loadingCatalogs && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#13171A] px-4 py-3 text-sm text-[#8B9AA0] shadow-sm">
          Cargando proveedores y productos…
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 shadow-sm">
          {errorMsg}
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Confirmar orden de compra"
        message={confirmMessage}
        onClose={() => setShowConfirm(false)}
        confirmText="Confirmar"
        onConfirm={guardarOrden}
      />
    </div>
  );
}

const Label: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <label
    className={[
      "mb-1.5 block text-xs font-medium tracking-wide text-white/65",
      className,
    ].join(" ")}
  >
    {children}
  </label>
);