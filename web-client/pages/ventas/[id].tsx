"use client";
import React, { useEffect, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import Button from "@/components/buttons/button";
import { useApi } from "@/components/hooks/useApi";
import { formatMoney } from "@/helpers/ui-helpers";
import { useRouter } from "next/router";

type VentaDetalle = {
  ventaDetalleID?: number;
  productoID?: number | null;
  sku: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuentoLineaPorcentaje?: number; // TODO
  importe: number;
  bodegaID?: number;
};

type VentaGetDto = {
  ventaID: number;
  clienteID?: number;
  clienteCodigo?: string;
  clienteNombre?: string;
  fecha: string; // ISO
  subtotal: number;
  descuento?: number;
  total: number;
  observaciones?: string | null; // TODO
  detalles: VentaDetalle[];
  estado: "Registrada" | "Anulada"
};

export default function FacturaVentaPage() {
  const { query } = useRouter();
  const id = query.id as string | undefined;
  const { call } = useApi();

  const [venta, setVenta] = useState<VentaGetDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [anulando, setAnulando] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await call<VentaGetDto>(`/api/ventas/${id}`, {
          method: "GET",
        });
        if (alive) setVenta(data ?? null);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "No se pudo obtener la venta.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, call]);

  const fechaFmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString() : "";
  const imprimir = () => window.print();

  const anularVenta = async () => {
    if (!venta?.ventaID) return;
    try {
      await call(`/api/ventas/${id}`, {
        method: "DELETE",
      });
      setVenta({...venta, estado: "Anulada"});
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo anular la venta.");
    } finally {
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader
        title={`Factura de venta #${id ?? "—"}`}
        subtitle="Visualización de venta"
      />

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Cargando…
        </div>
      )}

      {err && !loading && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {err}
        </div>
      )}

      {!loading && venta && (
        <section className="rounded-2xl border border-white/10 bg-white/5 print:bg-white print:text-black">
          <div className="flex items-start justify-between gap-4 px-4 py-4">
            <div>
              <h2 className="text-lg font-bold text-white/90 print:text-black">
                Factura de venta
              </h2>
              <div className="text-xs text-white/60 print:text-black/70">
                Venta #{venta.ventaID} {venta.estado === "Registrada" ? "" : " **Anulada**"}
              </div>
            </div>
            <Button type="button" onClick={imprimir} variant="solid-emerald">
              Imprimir
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-white/10 px-4 py-4 md:grid-cols-3">
            <InfoBlock label="Cliente">
              <div className="font-semibold">{venta.clienteNombre ?? "—"}</div>
            </InfoBlock>
            <InfoBlock label="Fecha">{fechaFmt(venta.fecha)}</InfoBlock>
            <InfoBlock label="Observaciones">
              {venta.observaciones ?? "—"}
            </InfoBlock>
          </div>

          <div className="overflow-x-auto border-t border-white/10 print:border-y print:border-black/20">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60 print:bg-black/5 print:text-black/70">
                  <Th>SKU</Th>
                  <Th>Descripción</Th>
                  <Th className="text-right">Cant.</Th>
                  <Th className="text-right">P. Unit</Th>
                  <Th className="text-right">Desc. %</Th>
                  <Th className="text-right">Importe</Th>
                  <Th className="text-right">Bodega</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 print:divide-black/10">
                {venta.detalles.map((d, i) => (
                  <tr
                    key={i}
                    className="hover:bg-white/5 print:hover:bg-transparent"
                  >
                    <Td>{d.sku}</Td>
                    <Td>{d.descripcion}</Td>
                    <Td className="text-right">{d.cantidad}</Td>
                    <Td className="text-right">
                      {formatMoney(d.precioUnitario)}
                    </Td>
                    <Td className="text-right">
                      {d.descuentoLineaPorcentaje ?? 0}
                    </Td>
                    <Td className="text-right">{formatMoney(d.importe)}</Td>
                    <Td className="text-right">{d.bodegaID ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-end gap-6 px-4 py-4 sm:flex-row sm:justify-end">
            <Tot label="Subtotal" value={venta.subtotal} />
            {typeof venta.descuento === "number" &&
              !Number.isNaN(venta.descuento) && (
                <Tot label={`Descuento`} value={venta.descuento ?? 0} />
              )}
            <Tot label="Total" value={venta.total} strong />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-4">
            <Button
              type="button"
              variant="danger"
              onClick={anularVenta}
              disabled={anulando}
            >
              {anulando ? "Anulando…" : "Anular venta"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

/* Helpers UI locales */
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
  <td
    className={["px-3 py-2 text-white/80 print:text-black/80", className].join(
      " "
    )}
  >
    {children}
  </td>
);
const InfoBlock: React.FC<React.PropsWithChildren<{ label: string }>> = ({
  label,
  children,
}) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-3 print:bg-transparent print:border-black/10">
    <div className="mb-1 text-xs text-white/60 print:text-black/70">
      {label}
    </div>
    <div className="text-white/90 print:text-black">{children}</div>
  </div>
);
const Tot: React.FC<{ label: string; value: number; strong?: boolean }> = ({
  label,
  value,
  strong,
}) => (
  <div className="text-right">
    <div className="text-xs text-white/60 print:text-black/70">{label}</div>
    <div
      className={
        strong
          ? "text-lg font-bold text-white print:text-black"
          : "font-semibold text-white/90 print:text-black"
      }
    >
      {formatMoney(value)}
    </div>
  </div>
);
