"use client";

import React, { useEffect, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import Button from "@/components/buttons/button";
import { CardTable, Th, Td } from "../../components/ui/table";
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
  producto?: ProductoMini;
  cantidad?: number;
  precioUnitario?: number;
  subtotal?: number;
};

export default function RegistrarOrdenCompraPage() {
  const { call } = useApi();
  const router = useRouter();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<ProductoMini[]>([]);
  const [proveedorSelected, setProveedorSelected] = useState<Proveedor | undefined>();

  const [fechaEstimada, setFechaEstimada] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const provData = await call<Proveedor[]>("/api/proveedores", {
          method: "GET",
        });

        const prodData = await call<ProductoMini[]>("/api/productos/mini", {
          method: "GET",
        });

        if (!alive) return;
        if (provData) setProveedores(provData);
        if (prodData) {
          setProductos(
            prodData.map((p) => ({
              productoID: p.productoID,
              sku: p.sku,
              nombre: p.nombre,
              descripcion: p.descripcion,
            }))
          );
        }
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(
          e?.message ?? "No se pudieron cargar proveedores o productos."
        );
      }
    })();

    return () => {
      alive = false;
    };
  }, [call]);

  const patchLine = (lineId: string, patch: Partial<Line>) => {
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l))
    );
  };

  const handleProductChange =
    (lineId: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const sku = e.target.value;
      const product = productos.find((p) => p.sku === sku);
      if (!product) return;

      const defaultPrice = 0; 

      patchLine(lineId, {
        producto: product,
        cantidad: 1,
        precioUnitario: defaultPrice,
        subtotal: defaultPrice,
      });
    };

  const handleCantidadChange = (line: Line, newQty: number) => {
    const price = line.precioUnitario ?? 0;
    patchLine(line.lineId, {
      cantidad: newQty,
      subtotal: newQty * price,
    });
  };

  const handlePrecioChange = (line: Line, newPrice: number) => {
    const qty = line.cantidad ?? 0;
    patchLine(line.lineId, {
      precioUnitario: newPrice,
      subtotal: qty * newPrice,
    });
  };

  const subtotal = lines
    .map((l) => l.subtotal ?? 0)
    .reduce((x, y) => x + y, 0);

  function validateBeforePost() {
    if (!proveedorSelected?.proveedorID) return "Selecciona un proveedor.";
    if (lines.length === 0) return "Agrega al menos un producto.";
    for (const l of lines) {
      if (!l.producto?.sku) return "Hay una línea sin producto.";
      if (!l.cantidad || l.cantidad <= 0)
        return "Hay una línea con cantidad inválida.";
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
      fechaSolicitud: new Date(),
      fechaEstimada: fechaEstimada ? new Date(fechaEstimada) : undefined,
      observaciones: notes || undefined,
      lineas: lines.map((l) => ({
        sku: l.producto!.sku!,
        cantidad: l.cantidad ?? 1,
        precioUnitario:
          l.precioUnitario && l.precioUnitario > 0
            ? l.precioUnitario
            : undefined,
      })),
    };

    try {
      setSaving(true);
      const res = await call<{ ordenCompraID: number }>("/api/ordenes-compra", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setLines([]);
      setNotes("");
      setFechaEstimada("");

      if (res?.ordenCompraID) {
        router.replace(`/compras/${res.ordenCompraID}`);
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? "No se pudo registrar la orden de compra.");
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader
        title="Registrar orden de compra"
        subtitle="Selecciona proveedor y productos a solicitar"
      />

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <Label>Proveedor</Label>
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
              value={proveedorSelected?.proveedorID ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                setProveedorSelected(
                  proveedores.find((p) => p.proveedorID === id)
                );
              }}
            >
              <option value="" disabled className="text-black">
                Selecciona un proveedor
              </option>
              {proveedores.map((p) => (
                <option
                  key={p.proveedorID}
                  value={p.proveedorID}
                  className="text-black"
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
              onChange={(e) => setFechaEstimada(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <Label>Observaciones</Label>
            <input
              placeholder="Opcional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold text-white/90">
            Productos solicitados
          </h2>
          <Button
            type="button"
            variant="primary"
            className="!bg-[#A30862] hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40"
            onClick={() =>
              setLines((prev) => [...prev, { lineId: crypto.randomUUID() }])
            }
          >
            + Agregar producto
          </Button>
        </div>

        <div className="overflow-x-auto border-t border-white/10">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
                <Th>Producto</Th>
                <Th>Cant.</Th>
                <Th>Precio unit.</Th>
                <Th>Subtotal</Th>
                <Th className="text-right">—</Th>
              </tr>
            </thead>
            {lines.length > 0 ? (
              <tbody className="divide-y divide-white/10">
                {lines.map((line) => (
                  <tr key={line.lineId} className="hover:bg-white/5">
                    <Td>
                      <select
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                        value={line.producto?.sku ?? ""}
                        onChange={handleProductChange(line.lineId)}
                      >
                        <option value="" disabled className="text-black">
                          Selecciona producto
                        </option>
                        {productos.map((p) => (
                          <option
                            key={p.sku ?? String(p.productoID)}
                            value={p.sku ?? ""}
                            className="text-black"
                          >
                            {p.nombre} - {p.sku}
                          </option>
                        ))}
                      </select>
                    </Td>
                    <Td>
                      <input
                        type="number"
                        min={1}
                        defaultValue={1}
                        onChange={(e) =>
                          handleCantidadChange(line, Number(e.target.value))
                        }
                        className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                      />
                    </Td>
                    <Td>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.precioUnitario ?? 0}
                        onChange={(e) =>
                          handlePrecioChange(line, Number(e.target.value))
                        }
                        className="w-32 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                      />
                    </Td>
                    <Td className="font-semibold text-white/90">
                      {formatMoney(line.subtotal ?? 0)}
                    </Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setLines((prev) =>
                            prev.filter((l) => l.lineId !== line.lineId)
                          )
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                      >
                        Quitar
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td className="px-4 py-4 text-xs tracking-wide text-white/40">
                    Agrega un producto para iniciar la orden.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {lines.length > 0 && (
          <div className="flex flex-col items-end gap-6 px-4 py-4 sm:flex-row sm:justify-end">
            <div className="text-right">
              <div className="text-xs text-white/60">Total estimado</div>
              <div className="text-lg font-bold text-white">
                {formatMoney(subtotal)}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <Button
            type="button"
            variant="primary"
            className="!bg-[#A30862] hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40 disabled:!opacity-60"
            disabled={!lines || lines.length === 0 || saving}
            onClick={() => setShowConfirm(true)}
          >
            {saving ? "Guardando…" : "Registrar orden"}
          </Button>
        </div>
      </section>

      {errorMsg && (
        <div className="mt-3 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-3 text-xs text-rose-100">
          {errorMsg}
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Confirmar orden de compra"
        message="¿La orden de compra es correcta?"
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
    className={["mb-1 block text-xs font-medium text-white/70", className].join(
      " "
    )}
  >
    {children}
  </label>
);
