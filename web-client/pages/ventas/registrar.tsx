"use client";

import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useApi } from "@/components/hooks/useApi";
import { Cliente } from "@/components/clientes/types";
import { getFormattedDate } from "@/helpers/dateHelper";
import Button from "@/components/buttons/button";
import { formatMoney } from "@/helpers/ui-helpers";
import { ProductoInLine } from "../../types/types";
import { useRouter } from "next/router";

interface Line {
  lineId: string;
  producto?: ProductoInLine;
  cantidad: number;
  cantidadInput: string;
  descuento: number;
  descuentoInput: string;
  subtotal: number;
  Bodega?: { nombre: string; id: string; cantidad: number };
}

type CreateVentaResponse = {
  ventaID: number;
  clienteID?: number;
  clienteCodigo?: string;
  fecha?: string;
  subtotal?: number;
  descuento?: number;
  total?: number;
  estado?: string;
  message?: string;
};

function getApiErrorMessage(error: any, fallback: string) {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  return (
    responseData?.message ||
    responseData?.detail ||
    responseData?.title ||
    error?.message ||
    fallback
  );
}

function parseDecimalInput(value: string): number {
  if (!value.trim()) return 0;

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

export default function RegistrarVentaPage() {
  const { call } = useApi();
  const router = useRouter();

  const [showConfirm, setShowConfirm] = useState(false);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [products, setProducts] = useState<ProductoInLine[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [clientSelected, setClientSelected] = useState<Cliente | undefined>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const clienteDescuentoPct = Number(
    (clientSelected as any)?.descuentoPorcentaje ?? 0
  );

  const fetchPageData = async () => {
    try {
      setPageLoading(true);
      setErrorMsg(null);

      const clientData = await call<Cliente[]>(`/api/clientes`, {
        method: "GET",
      });

      const productsData = await call<ProductoInLine[]>(
        `/api/productos/mini`,
        {
          method: "GET",
        }
      );

      const productIds = (productsData ?? []).map((p) => p.productoID);

      if (clientData) setClients(clientData);

      if (productsData && productIds.length > 0) {
        const qs = new URLSearchParams();
        for (const id of productIds) qs.append("productoIds", String(id));

        const url = `/api/inventario/disponibilidad-por-productos?${qs.toString()}`;

        const disponibilidadData = await call<any[]>(url, {
          method: "GET",
        });

        productsData.forEach((p) => {
          p.bodegas =
            disponibilidadData?.find((stock) => p.productoID === stock.id)
              ?.bodegas ?? [];
        });
      }

      setProducts(
        (productsData ?? []).filter((p) => (p.bodegas?.length ?? 0) > 0)
      );
    } catch (e: any) {
      setErrorMsg(
        getApiErrorMessage(
          e,
          "No se pudo cargar la información para registrar la venta."
        )
      );
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData().catch(console.error);
  }, []);

  const recalculateLineSubtotal = (
    producto?: ProductoInLine,
    cantidad?: number,
    descuento?: number
  ) => {
    const precio = Number(producto?.precioVenta ?? 0);
    const qty = Number(cantidad ?? 0);
    const disc = Number(descuento ?? 0);

    const bruto = precio * qty;
    const subtotal = bruto - (bruto * disc) / 100;

    return Number.isFinite(subtotal) ? subtotal : 0;
  };

  const patchLine = (lineId: string, patch: Partial<Line>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.lineId !== lineId) return l;

        const next = { ...l, ...patch };
        return {
          ...next,
          subtotal: recalculateLineSubtotal(
            next.producto,
            next.cantidad,
            next.descuento
          ),
        };
      })
    );
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        lineId: crypto.randomUUID(),
        cantidad: 1,
        cantidadInput: "",
        descuento: 0,
        descuentoInput: "",
        subtotal: 0,
      },
    ]);
  };

  const removeLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  };

  const handleProductChange =
    (lineId: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const sku = e.target.value;
      const product = products.find((p) => p.sku === sku);
      if (!product) return;

      const firstBodega =
        product.bodegas && product.bodegas.length > 0
          ? product.bodegas[0]
          : undefined;

      patchLine(lineId, {
        producto: product,
        cantidad: 1,
        cantidadInput: "",
        descuento: 0,
        descuentoInput: "",
        Bodega: firstBodega
          ? {
              id: String(firstBodega.id),
              nombre: firstBodega.nombre,
              cantidad: firstBodega.cantidad,
            }
          : undefined,
      });
    };

  const handleCantidadChange = (lineId: string, rawValue: string) => {
    patchLine(lineId, {
      cantidadInput: rawValue,
      cantidad: parseDecimalInput(rawValue),
    });
  };

  const handleDescuentoChange = (lineId: string, rawValue: string) => {
    patchLine(lineId, {
      descuentoInput: rawValue,
      descuento: parseDecimalInput(rawValue),
    });
  };

  const handleBodegaChange =
    (lineId: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      const line = lines.find((l) => l.lineId === lineId);
      const bodegas = line?.producto?.bodegas ?? [];
      const b = bodegas.find((x) => String(x.id) === id);
      if (!b) return;

      patchLine(lineId, {
        Bodega: { id: String(b.id), nombre: b.nombre, cantidad: b.cantidad },
      });
    };

  const subtotalLineas = useMemo(
    () => lines.reduce((acc, l) => acc + Number(l.subtotal ?? 0), 0),
    [lines]
  );

  const descuentoClienteMonto = useMemo(() => {
    const monto = subtotalLineas * (clienteDescuentoPct / 100);
    return Number.isFinite(monto) ? monto : 0;
  }, [subtotalLineas, clienteDescuentoPct]);

  const impuestosMonto = 0;
  const totalVenta = Math.max(
    0,
    subtotalLineas - descuentoClienteMonto + impuestosMonto
  );

  const cantidadesAgrupadas = useMemo(() => {
    const grouped = new Map<
      string,
      {
        sku: string;
        productoNombre: string;
        bodegaId: string;
        bodegaNombre: string;
        stockDisponible: number;
        cantidadSolicitada: number;
      }
    >();

    for (const line of lines) {
      const sku = line.producto?.sku?.trim();
      const productoNombre = line.producto?.nombre?.trim() || "Producto";
      const bodegaId = line.Bodega?.id?.trim();
      const bodegaNombre = line.Bodega?.nombre?.trim() || "Bodega";
      const stockDisponible = Number(line.Bodega?.cantidad ?? 0);
      const cantidadSolicitada = Number(line.cantidad ?? 0);

      if (!sku || !bodegaId || !Number.isFinite(cantidadSolicitada)) continue;

      const key = `${sku}__${bodegaId}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.cantidadSolicitada += cantidadSolicitada;
      } else {
        grouped.set(key, {
          sku,
          productoNombre,
          bodegaId,
          bodegaNombre,
          stockDisponible,
          cantidadSolicitada,
        });
      }
    }

    return Array.from(grouped.values());
  }, [lines]);

  function validateBeforePost() {
    if (!clientSelected?.codigoCliente?.trim()) return "Selecciona un cliente.";
    if (lines.length === 0) return "Agrega al menos un producto.";

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const index = i + 1;

      if (!l.producto?.sku)
        return `La línea ${index} no tiene producto seleccionado.`;
      if (!l.Bodega?.id)
        return `La línea ${index} no tiene bodega seleccionada.`;
      if (!l.cantidadInput.trim())
        return `La cantidad de la línea ${index} es obligatoria.`;
      if (!Number.isFinite(l.cantidad) || l.cantidad <= 0)
        return `La cantidad de la línea ${index} debe ser mayor que cero.`;
      if (
        l.descuentoInput.trim() &&
        (!Number.isFinite(l.descuento) || l.descuento < 0 || l.descuento > 100)
      )
        return `El descuento de la línea ${index} debe estar entre 0 y 100.`;
      if (l.Bodega?.cantidad != null && l.cantidad > l.Bodega.cantidad)
        return `La cantidad de la línea ${index} supera el stock disponible en la bodega seleccionada.`;
    }

    for (const item of cantidadesAgrupadas) {
      if (item.cantidadSolicitada > item.stockDisponible) {
        return `Stock insuficiente para ${item.productoNombre} (${item.sku}) en ${item.bodegaNombre}. Disponible: ${item.stockDisponible}, solicitado entre líneas repetidas: ${item.cantidadSolicitada}.`;
      }
    }

    return null;
  }

  const realizarVenta = async () => {
    const validationMsg = validateBeforePost();
    if (validationMsg) {
      setErrorMsg(validationMsg);
      setShowConfirm(false);
      return;
    }

    const payload = {
      clienteCodigo: clientSelected!.codigoCliente!.trim(),
      fecha: new Date().toISOString(),
      observaciones: notes.trim() || undefined,
      lineas: lines.map((l) => ({
        sku: l.producto!.sku!.trim(),
        cantidad: l.cantidad,
        descuento: l.descuentoInput.trim() ? l.descuento : 0,
        bodega: { id: String(l.Bodega!.id) },
      })),
    };

    try {
      setSaving(true);
      setErrorMsg(null);

      const res = await call<CreateVentaResponse>("/api/ventas", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setLines([]);
      setNotes("");
      setClientSelected(undefined);

      router.replace(`/ventas/${res.ventaID}?created=1`);
    } catch (e: any) {
      setErrorMsg(getApiErrorMessage(e, "No se pudo registrar la venta."));
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <header className="mb-5">
        <nav className="mb-3 flex items-center text-sm text-[#8B9AA0]">
          <div className="flex items-center gap-1">
            <svg
              className="h-4 w-4 opacity-80"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M3 10.25 12 3l9 7.25V21a1 1 0 0 1-1 1h-5.5v-6.5h-5V22H4a1 1 0 0 1-1-1v-10.75Z" />
            </svg>
            <span>Inicio</span>
          </div>

          <span className="mx-2 text-[#4B5563]">/</span>

          <div className="flex items-center gap-1 text-white">
            <svg
              className="h-4 w-4 opacity-80"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M5 4h14a1 1 0 0 1 1 1v3H4V5a1 1 0 0 1-1-1Zm-1 6h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
            </svg>
            <span>Ventas</span>
          </div>
        </nav>
      </header>

      <SectionHeader
        title="Registrar venta"
        subtitle="Formulario visual para registrar clientes, productos, descuentos e inventario."
      />

      {pageLoading && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-[#121618] px-4 py-3 text-sm text-[#8B9AA0] shadow-sm">
          Cargando información…
        </div>
      )}

      <section className="mb-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.16)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label>Cliente</Label>
            <select
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0F1416] px-4 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
              value={clientSelected?.codigoCliente ?? ""}
              onChange={(e) => {
                const selected = clients.find(
                  (c) => c.codigoCliente === e.target.value
                );
                setClientSelected(selected);
              }}
              disabled={saving || pageLoading}
            >
              <option
                value=""
                className="bg-[#0F1416]"
                style={{ color: "#ffffff" }}
              >
                Selecciona un cliente
              </option>
              {clients.map((client) => (
                <option
                  key={client.codigoCliente ?? String(client.clienteID)}
                  value={client.codigoCliente ?? ""}
                  className="bg-[#0F1416]"
                  style={{ color: "#ffffff" }}
                >
                  {client.nombre} - {client.codigoCliente}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Fecha</Label>
            <input
              value={getFormattedDate(new Date())}
              type="date"
              readOnly
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Observaciones</Label>
            <input
              value={notes}
              placeholder="Opcional"
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Productos vendidos
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Agrega productos, selecciona bodega y ajusta cantidades o descuentos si aplica.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            className="h-11 !rounded-2xl !bg-[#A30862] px-5 hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40"
            onClick={addLine}
            disabled={saving || pageLoading}
          >
            + Agregar producto
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-[12px] uppercase tracking-[0.04em] text-white/55">
                <Th className="min-w-[280px]">Producto</Th>
                <Th className="min-w-[210px]">Bodega</Th>
                <Th className="min-w-[120px] text-center">Cant.</Th>
                <Th className="min-w-[150px] text-right">Precio</Th>
                <Th className="min-w-[140px] text-center">Desc. (%)</Th>
                <Th className="min-w-[180px] text-right">Subtotal</Th>
                <Th className="min-w-[110px] text-right">—</Th>
              </tr>
            </thead>

            {lines.length > 0 ? (
              <tbody className="divide-y divide-white/10">
                {lines.map((line, idx) => (
                  <tr key={line.lineId} className="align-middle hover:bg-white/[0.035]">
                    <Td>
                      <select
                        className="h-12 w-full rounded-2xl border border-white/10 bg-[#0F1416] px-4 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
                        value={line.producto?.sku ?? ""}
                        onChange={handleProductChange(line.lineId)}
                        disabled={saving}
                      >
                        <option
                          value=""
                          className="bg-[#0F1416]"
                          style={{ color: "#ffffff" }}
                        >
                          Selecciona producto
                        </option>
                        {products.map((product) => (
                          <option
                            key={product.sku ?? String(product.productoID)}
                            value={product.sku ?? ""}
                            className="bg-[#0F1416]"
                            style={{ color: "#ffffff" }}
                          >
                            {product.nombre} - {product.sku}
                          </option>
                        ))}
                      </select>
                    </Td>

                    <Td>
                      <select
                        className="h-12 w-full rounded-2xl border border-white/10 bg-[#0F1416] px-4 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
                        value={line.Bodega?.id ?? ""}
                        onChange={handleBodegaChange(line.lineId)}
                        disabled={saving || !line.producto}
                      >
                        <option
                          value=""
                          className="bg-[#0F1416]"
                          style={{ color: "#ffffff" }}
                        >
                          Selecciona bodega
                        </option>
                        {line.producto?.bodegas?.map((b) => (
                          <option
                            key={b.id}
                            value={String(b.id)}
                            className="bg-[#0F1416]"
                            style={{ color: "#ffffff" }}
                          >
                            {`${b.nombre} (${b.cantidad})`}
                          </option>
                        ))}
                      </select>
                    </Td>

                    <Td className="text-center">
                      <input
                        type="number"
                        min={0.01}
                        step="0.01"
                        value={line.cantidadInput}
                        onChange={(e) =>
                          handleCantidadChange(line.lineId, e.target.value)
                        }
                        disabled={saving || !line.producto}
                        placeholder="Cant."
                        className="h-12 w-28 rounded-2xl border border-white/10 bg-white/5 px-4 text-center text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
                      />
                    </Td>

                    <Td className="text-right">
                      <span className="inline-flex h-12 min-w-[120px] items-center justify-end rounded-2xl px-1 text-sm font-medium text-white/90">
                        {formatMoney(line.producto?.precioVenta ?? 0)}
                      </span>
                    </Td>

                    <Td className="text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={line.descuentoInput}
                        onChange={(e) =>
                          handleDescuentoChange(line.lineId, e.target.value)
                        }
                        disabled={saving || !line.producto}
                        placeholder="Desc."
                        className="h-12 w-28 rounded-2xl border border-white/10 bg-white/5 px-4 text-center text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/15"
                      />
                    </Td>

                    <Td className="text-right">
                      <div className="text-base font-semibold text-white/95">
                        {formatMoney(line.subtotal ?? 0)}
                      </div>
                      {line.Bodega && (
                        <div className="mt-1 text-[11px] text-white/40">
                          Stock disponible: {line.Bodega.cantidad}
                        </div>
                      )}
                    </Td>

                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={() => removeLine(line.lineId)}
                        disabled={saving}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-xs font-medium text-white/90 transition hover:bg-white/[0.10] disabled:opacity-50"
                        aria-label={`Quitar línea ${idx + 1}`}
                      >
                        Quitar
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="px-6 py-12" colSpan={7}>
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-2 text-sm font-medium text-white/70">
                        Aún no has agregado productos
                      </div>
                      <div className="text-xs text-white/35">
                        Usa el botón “Agregar producto” para empezar a registrar la venta.
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {lines.length > 0 && (
          <div className="border-t border-white/10 bg-white/[0.02] px-5 py-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-end">
              <TotCard label="Subtotal" value={subtotalLineas} />
              <TotCard
                label={`Descuento cliente${
                  clienteDescuentoPct > 0 ? ` (${clienteDescuentoPct}%)` : ""
                }`}
                value={descuentoClienteMonto}
              />
              <TotCard label="Impuestos" value={impuestosMonto} />
              <TotCard label="Total" value={totalVenta} highlight />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end border-t border-white/10 px-5 py-4">
          <Button
            type="button"
            variant="primary"
            className="h-11 !rounded-2xl !bg-[#A30862] px-6 hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40 disabled:!opacity-60"
            disabled={saving || pageLoading || lines.length === 0}
            onClick={() => setShowConfirm(true)}
          >
            {saving ? "Registrando..." : "Registrar venta"}
          </Button>
        </div>
      </section>

      {errorMsg && (
        <div className="mt-4 rounded-2xl border border-rose-400/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {errorMsg}
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Confirmar venta"
        message="¿La información de la venta es correcta?"
        onClose={() => setShowConfirm(false)}
        confirmText="Confirmar"
        onConfirm={realizarVenta}
      />
    </div>
  );
}

const Label: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <label
    className={["mb-1.5 block text-xs font-medium tracking-wide text-white/70", className].join(
      " "
    )}
  >
    {children}
  </label>
);

const Th: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <th className={["px-4 py-3 font-semibold", className].join(" ")}>{children}</th>
);

const Td: React.FC<
  React.PropsWithChildren<{ className?: string; colSpan?: number }>
> = ({ className = "", children, colSpan }) => (
  <td
    className={["px-4 py-3.5 text-white/85 align-middle", className].join(" ")}
    colSpan={colSpan}
  >
    {children}
  </td>
);

const TotCard: React.FC<{
  label: string;
  value: number;
  highlight?: boolean;
}> = ({ label, value, highlight }) => (
  <div
    className={
      highlight
        ? "min-w-[150px] rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-3 text-right"
        : "min-w-[140px] rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right"
    }
  >
    <div className="text-xs text-white/55">{label}</div>
    <div
      className={
        highlight
          ? "mt-1 text-xl font-bold text-white"
          : "mt-1 text-lg font-semibold text-white/95"
      }
    >
      {formatMoney(value)}
    </div>
  </div>
);