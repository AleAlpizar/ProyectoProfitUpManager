"use client";

import React, { useEffect, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import Button from "@/components/buttons/button";
import { useApi } from "@/components/hooks/useApi";
import { formatMoney } from "@/helpers/ui-helpers";
import { useRouter } from "next/router";
import { CardTable, Th, Td } from "@/components/ui/table";
import ConfirmDialog from "@/components/ConfirmDialog";

type VentaDetalle = {
  ventaDetalleID?: number;
  productoID?: number | null;
  sku: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuentoLineaPorcentaje?: number;
  importe: number;
  bodegaID?: number;
};

type VentaGetDto = {
  ventaID: number;
  clienteID?: number;
  clienteCodigo?: string;
  clienteNombre?: string;
  fecha: string;
  subtotal: number;
  descuento?: number;
  total: number;
  observaciones?: string | null;
  detalles: VentaDetalle[];
  estado: "Registrada" | "Anulada";
};

export default function FacturaVentaPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const { call } = useApi();

  const [venta, setVenta] = useState<VentaGetDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [anulando, setAnulando] = useState(false);
  const [showConfirmAnular, setShowConfirmAnular] = useState(false);

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
    setAnulando(true);
    try {
      await call(`/api/ventas/${id}`, { method: "DELETE" });
      setVenta({ ...venta, estado: "Anulada" });
      router.push("/ventas/historial");
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo anular la venta.");
    } finally {
      setAnulando(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader
        title={`Factura de venta #${id ?? "—"}`}
        subtitle="Visualización de venta"
      />

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-[#121618] p-4 text-sm text-[#8B9AA0]">
          Cargando…
        </div>
      )}

      {err && !loading && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
          {err}
        </div>
      )}

      {!loading && venta && (
        <section className="rounded-3xl border border-white/10 bg-[#13171A] print:bg-white print:text-black shadow-[0_30px_80px_rgba(0,0,0,.45)] ring-1 ring-black/20">
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-[#8B9AA0] print:hidden">
                Venta #{venta.ventaID}
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white print:text-black">
                Factura de venta
              </h2>
              <div className="text-xs text-[#8B9AA0] print:text-black/70">
                {venta.estado === "Anulada" ? (
                  <span className="inline-flex items-center gap-2">
                    Estado:
                    <span className="rounded-full border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 text-rose-200 text-[11px] font-medium">
                      Anulada
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Estado:
                    <span className="rounded-full border border-lime-400/40 bg-lime-400/10 px-2 py-0.5 text-lime-200 text-[11px] font-medium">
                      Registrada
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <Button
                type="button"
                variant="ghost"
                className="border border-white/10 bg-transparent text-xs text-white/80 hover:bg-white/5"
                onClick={() => router.push("/ventas/historial")}
              >
                ← Volver al historial
              </Button>
              <Button type="button" onClick={imprimir} variant="solid-emerald">
                Imprimir
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-white/10 px-5 py-4 md:grid-cols-3 print:border-t print:border-black/10">
            <InfoBlock label="Cliente">
              <div className="font-semibold">
                {venta.clienteNombre ?? "—"}
              </div>
            </InfoBlock>
            <InfoBlock label="Fecha">{fechaFmt(venta.fecha)}</InfoBlock>
            <InfoBlock label="Observaciones">
              {venta.observaciones ?? "—"}
            </InfoBlock>
          </div>

          <div className="print:border-y print:border-black/20">
            <CardTable>
              <thead>
                <tr className="bg-[#1C2224] text-left text-xs uppercase tracking-wide text-[#8B9AA0] print:bg-black/5 print:text-black/70">
                  <Th>SKU</Th>
                  <Th>Descripción</Th>
                  <Th className="text-right">Cant.</Th>
                  <Th className="text-right">P. Unit</Th>
                  <Th className="text-right">Desc. %</Th>
                  <Th className="text-right">Importe</Th>
                  <Th className="text-right">Bodega</Th>
                </tr>
              </thead>
              <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10 print:[&>tr]:border-black/10">
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
                    <Td className="text-right">
                      {formatMoney(d.importe)}
                    </Td>
                    <Td className="text-right">{d.bodegaID ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </CardTable>
          </div>

          <div className="flex flex-col items-end gap-6 px-5 py-5 sm:flex-row sm:justify-end">
            <Tot label="Subtotal" value={venta.subtotal} />
            {typeof venta.descuento === "number" &&
              !Number.isNaN(venta.descuento) && (
                <Tot label="Descuento" value={venta.descuento ?? 0} />
              )}
            <Tot label="Total" value={venta.total} strong />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4 print:hidden">
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowConfirmAnular(true)}
              disabled={anulando || venta.estado === "Anulada"}
            >
              {anulando ? "Anulando…" : "Anular venta"}
            </Button>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={showConfirmAnular}
        title="Anular venta"
        message={`¿Deseas anular la venta #${venta?.ventaID}?`}
        confirmText="Sí, anular"
        onClose={() => setShowConfirmAnular(false)}
        onConfirm={async () => {
          await anularVenta();
          setShowConfirmAnular(false);
        }}
      />
    </div>
  );
}

const InfoBlock: React.FC<
  React.PropsWithChildren<{ label: string }>
> = ({ label, children }) => (
  <div className="rounded-2xl border border-white/10 bg-[#121618] p-3 print:bg-transparent print:border-black/10">
    <div className="mb-1 text-xs text-[#8B9AA0] print:text-black/70">
      {label}
    </div>
    <div className="text-[#E6E9EA] print:text-black">{children}</div>
  </div>
);

const Tot: React.FC<{ label: string; value: number; strong?: boolean }> = ({
  label,
  value,
  strong,
}) => (
  <div className="text-right">
    <div className="text-xs text-[#8B9AA0] print:text-black/70">
      {label}
    </div>
    <div
      className={
        strong
          ? "text-lg font-bold text-white print:text-black"
          : "font-semibold text-[#E6E9EA] print:text-black"
      }
    >
      {formatMoney(value)}
    </div>
  </div>
);
