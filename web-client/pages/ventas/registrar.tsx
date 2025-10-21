import React, { useEffect, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useApi } from "@/components/hooks/useApi";
import { Cliente } from "@/components/clientes/types";
import { ProductoMini } from "@/components/hooks/useProductosMini";

export default function RegistrarVentaPage() {
  const { call } = useApi();

  const [showCancel, setShowCancel] = useState(false);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [products, setProducts] = useState<ProductoMini[]>([]);
  const [clientSelected, setClientSelected] = useState(null);

  const fetchPageData = async () => {
    const clientData = await call<Cliente[]>(`/api/clientes`, {
      method: "GET",
    });
    const productsData = await call<ProductoMini[]>(`/api/productos/mini`, {
      method: "GET",
    });
    if (clientData) setClients(clientData);
    if (productsData) setProducts(productsData);
  };

  useEffect(() => {
    fetchPageData().catch(console.error);
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader
        title="Registrar venta"
        subtitle="Formulario visual: cliente, productos, descuentos e inventario"
      />

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label>Cliente</Label>
            <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20">
              {clients &&
                clients.map((client) => (
                  <option key={client.codigoCliente} className="text-black">
                    {client.nombre} - {client.codigoCliente}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <Label>Fecha</Label>
            <input
              type="date"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="md:col-span-1">
            <Label>Observaciones</Label>
            <input
              placeholder="Opcional"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="flex items-end justify-end">
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Anular venta
            </button>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-1 text-xs text-white/60">Vínculo a cliente</div>
          <Badge tone="success">Venta vinculada a cliente — (Lucia)</Badge>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-1 text-xs text-white/60">Vínculo a inventario</div>
          <Badge tone="success">Vinculación a inventario</Badge>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-1 text-xs text-white/60">Reducción de stock</div>
          <Badge tone="success">Reducción automática</Badge>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold text-white/90">
            Productos vendidos
          </h2>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Agregar producto
          </button>
        </div>

        <div className="overflow-x-auto border-t border-white/10">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
                <Th>Producto</Th>
                <Th>Cant.</Th>
                <Th>Precio</Th>
                <Th>Desc. (%)</Th>
                <Th>Subtotal</Th>
                <Th className="text-right">—</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr className="hover:bg-white/5">
              {/* Producto */}
                <Td>
                  <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20">
                    {clients &&
                      products.map((product) => (
                        <option key={product.sku} className="text-black">
                          {product.nombre} - {product.sku}
                        </option>
                      ))}
                  </select>
                </Td>
                {/* Cantidad */}
                <Td>
                  <input
                    type="number"
                    defaultValue={1}
                    className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                  />
                </Td>
                {/* Precio */}
                <Td>
                  <input
                    type="number"
                    defaultValue={products[0] ? products[0].precioVenta : 0}
                    className="w-32 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                  />
                </Td>
                {/* Descuento */}
                <Td>
                  <input
                    type="number"
                    defaultValue={10}
                    className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
                  />
                </Td>
                {/* Subtotal */}
                <Td className="font-semibold text-white/90">$225.00</Td>
                <Td className="text-right">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                  >
                    Quitar
                  </button>
                </Td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-end gap-6 px-4 py-4 sm:flex-row sm:justify-end">
          <div className="text-right">
            <div className="text-xs text-white/60">Subtotal</div>
            <div className="font-semibold text-white/90">$225.00</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/60">Impuestos</div>
            <div className="font-semibold text-white/90">$29.25</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/60">Total</div>
            <div className="text-lg font-bold text-white">$254.25</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Registrar venta
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={showCancel}
        title="Anular venta"
        message="¿Deseas anular esta venta? Se restauraría el inventario si aplica."
        onClose={() => setShowCancel(false)}
        confirmText="Anular"
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
  <th className={["px-3 py-2 font-semibold", className].join(" ")}>
    {children}
  </th>
);

const Td: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <td className={["px-3 py-2 text-white/80", className].join(" ")}>
    {children}
  </td>
);

const Badge: React.FC<
  React.PropsWithChildren<{ tone?: "success" | "warn" | "danger" }>
> = ({ tone = "success", children }) => {
  const map: Record<string, string> = {
    success: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25",
    warn: "bg-yellow-400/15  text-yellow-300  ring-1 ring-yellow-400/25",
    danger: "bg-red-400/15     text-red-300     ring-1 ring-red-400/25",
  };
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        map[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
};
