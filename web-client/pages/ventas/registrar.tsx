import React, { useEffect, useState } from "react";
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
  cantidad?: number;
  descuento?: number;
  subtotal?: number;
  Bodega?: { nombre: string; id: string; cantidad: number };
}

export default function RegistrarVentaPage() {
  const { call } = useApi();
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [products, setProducts] = useState<ProductoInLine[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [clientSelected, setClientSelected] = useState<Cliente>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPageData = async () => {
    const clientData = await call<Cliente[]>(`/api/clientes`, {
      method: "GET",
    });
    const productsData = await call<ProductoInLine[]>(`/api/productos/mini`, {
      method: "GET",
    });
    const productIds = productsData.map((p) => p.productoID);

    if (clientData) setClients(clientData);

    if (productIds.length > 0) {
      const qs = new URLSearchParams();
      for (const id of productIds) qs.append("productoIds", String(id));

      const url = `/api/inventario/disponibilidad-por-productos?${qs.toString()}`;

      const disponibilidadData = await call<any[]>(url, {
        method: "GET",
      });

      productsData.forEach((p) => {
        p.bodegas =
          disponibilidadData.find((stock) => p.productoID === stock.id)
            ?.bodegas ?? [];
      });
    }
    if (productsData)
      setProducts(productsData.filter((p) => p.bodegas?.length ?? 0 > 0));
  };

  useEffect(() => {
    fetchPageData().catch(console.error);
  }, []);

  const patchLine = (lineId: string, patch: Partial<Line>) => {
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l))
    );
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
        descuento: 0,
        subtotal: product.precioVenta,
        Bodega: firstBodega
          ? {
              id: String(firstBodega.id),
              nombre: firstBodega.nombre,
              cantidad: firstBodega.cantidad,
            }
          : undefined,
      });
    };

  const handleCantidadChange = (line: Line, newQty: number) => {
    const precioBatch = newQty * (line.producto?.precioVenta ?? 0);
    patchLine(line.lineId, {
      cantidad: newQty,
      subtotal: precioBatch - (precioBatch / 100) * (line.descuento ?? 0),
    });
  };

  const handleDescuentoChange = (line: Line, newDiscount: number) => {
    const precioBatch =
      (line.cantidad ?? 0) * (line.producto?.precioVenta ?? 0);
    patchLine(line.lineId, {
      descuento: newDiscount,
      subtotal: precioBatch - (precioBatch / 100) * (newDiscount ?? 0),
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

  function validateBeforePost() {
    if (!clientSelected?.codigoCliente) return "Selecciona un cliente.";
    if (lines.length === 0) return "Agrega al menos un producto.";
    for (const l of lines) {
      if (!l.producto?.sku) return "Hay una línea sin producto.";
      if (!l.cantidad || l.cantidad <= 0)
        return "Hay una línea con cantidad inválida.";
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
      clienteCodigo: clientSelected!.codigoCliente!,
      fecha: new Date(),
      observaciones: notes || undefined,
      lineas: lines.map((l) => ({
        sku: l.producto!.sku!,
        cantidad: l.cantidad ?? 1,
        descuento: l.descuento ?? 0,
        bodega: { id: String(l.Bodega!.id) },
      })),
    };

    try {
      const res = await call<{ ventaID: string }>("/api/ventas", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setLines([]);
      setNotes("");
      router.replace(`/ventas/${res.ventaID}`);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "No se pudo registrar la venta.");
    }
    setShowConfirm(false);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <header className="mb-4">
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
        subtitle="Formulario visual: cliente, productos, descuentos e inventario"
      />

      <section
        about="bill-info"
        className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label>Cliente</Label>
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
              value={clientSelected?.codigoCliente ?? ""}
              onChange={(e) => {
                setClientSelected(
                  clients.find((c) => c.codigoCliente === e.target.value)
                );
              }}
            >
              <option value="" disabled className="text-black">
                Selecciona un cliente
              </option>
              {clients &&
                clients.map((client) => (
                  <option
                    key={client.codigoCliente ?? String(client.clienteID)}
                    value={client.codigoCliente ?? ""}
                    className="text-black"
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
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="md:col-span-1">
            <Label>Observaciones</Label>
            <input
              placeholder="Opcional"
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold text-white/90">
            Productos vendidos
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
                <Th>Bodega</Th>
                <Th>Cant.</Th>
                <Th>Precio</Th>
                <Th>Desc. (%)</Th>
                <Th>Subtotal</Th>
                <Th className="text-right">—</Th>
              </tr>
            </thead>
            {lines && lines.length > 0 ? (
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
                        {products.map((product) => (
                          <option
                            key={product.sku ?? String(product.productoID)}
                            value={product.sku ?? ""}
                            className="text-black"
                          >
                            {product.nombre} - {product.sku}
                          </option>
                        ))}
                      </select>
                    </Td>
                    <Td>
                      <select
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                        value={line.Bodega?.id ?? ""}
                        onChange={handleBodegaChange(line.lineId)}
                      >
                        <option value="" disabled className="text-black">
                          Selecciona bodega
                        </option>
                        {line.producto?.bodegas?.map((b) => (
                          <option
                            key={b.id}
                            value={String(b.id)}
                            className="text-black"
                          >
                            {`${b.nombre} (${b.cantidad})`}
                          </option>
                        ))}
                      </select>
                    </Td>

                    <Td>
                      <input
                        type="number"
                        defaultValue={1}
                        onChange={(e) =>
                          handleCantidadChange(line, Number(e.target.value))
                        }
                        className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                      />
                    </Td>
                    <Td>
                      <span className="w-32 rounded-xl px-3 py-2 text-sm text-white outline-none transition">
                        {formatMoney(line.producto?.precioVenta ?? 0)}
                      </span>
                    </Td>
                    <Td>
                      <input
                        type="number"
                        defaultValue={line.descuento ?? 0}
                        onChange={(e) =>
                          handleDescuentoChange(
                            line,
                            Number(e.target.value)
                          )
                        }
                        className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
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
              <tbody className="divide-y divide-white/10">
                <tr aria-colspan={42}>
                  <td className="px-4 py-4">
                    <span className="text-left text-xs tracking-wide text-white/30">
                      Agrega una columna para iniciar.
                    </span>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {lines && lines.length > 0 && (
          <div className="flex flex-col items-end gap-6 px-4 py-4 sm:flex-row sm:justify-end">
            <div className="text-right">
              <div className="text-xs text-white/60">Subtotal</div>
              <div className="font-semibold text-white/90">
                {formatMoney(
                  lines.map((l) => l.subtotal ?? 0).reduce((x, y) => x + y, 0)
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60">Impuestos</div>
              <div className="font-semibold text-white/90">
                {formatMoney(
                  lines.map((l) => l.subtotal ?? 0).reduce((x, y) => x + y, 0) *
                    0.13
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60">Total</div>
              <div className="text-lg font-bold text-white">
                {formatMoney(
                  lines.map((l) => l.subtotal ?? 0).reduce((x, y) => x + y, 0) *
                    1.13
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <Button
            type="button"
            variant="primary"
            className="!bg-[#A30862] hover:!opacity-95 focus:!ring-2 focus:!ring-[#A30862]/40 disabled:!opacity-60"
            disabled={!lines || lines.length === 0}
            onClick={() => setShowConfirm(true)}
          >
            Registrar venta
          </Button>
        </div>
      </section>

      {errorMsg && (
        <div className="mt-3 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-3 text-xs text-rose-100">
          {errorMsg}
        </div>
      )}

      <ConfirmDialog
        open={showCancel}
        title="  Anular venta(s) →"
        message="¿Deseas salir de esta venta para anular existentes?"
        onClose={() => setShowCancel(false)}
        confirmText="Anular"
      />

      <ConfirmDialog
        open={showConfirm}
        title="  Confirmar venta"
        message="La venta es correcta?"
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
    className={["mb-1 block text-xs font-medium text-white/70", className].join(
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
  <th className={["px-3 py-2 font-semibold", className].join(" ")}>{children}</th>
);

const Td: React.FC<
  React.PropsWithChildren<{ className?: string; colSpan?: number }>
> = ({ className = "", children, colSpan }) => (
  <td
    className={["px-3 py-2 text-white/80", className].join(" ")}
    colSpan={colSpan}
  >
    {children}
  </td>
);
