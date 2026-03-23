"use client";

import React, { useEffect, useMemo, useState } from "react";
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

function getApiErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.title ||
    error?.message ||
    fallback
  );
}

export default function FacturaVentaPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const created = router.query.created === "1";
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
        if (alive) setErr(getApiErrorMessage(e, "No se pudo obtener la venta."));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, call]);

  const fechaFmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "");
  const imprimir = () => window.print();

  const estadoBadge = useMemo(() => {
    if (venta?.estado === "Anulada") {
      return (
        <span className="inline-flex items-center rounded-full border border-rose-400/35 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-200">
          Anulada
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full border border-lime-400/35 bg-lime-400/10 px-3 py-1 text-xs font-semibold text-lime-200">
        Registrada
      </span>
    );
  }, [venta?.estado]);

  const anularVenta = async () => {
    if (!venta?.ventaID) return;

    setAnulando(true);
    setErr(null);

    try {
      await call(`/api/ventas/${id}`, { method: "DELETE" });
      setShowConfirmAnular(false);
      router.push("/ventas/historial?anulada=1");
    } catch (e: any) {
      setErr(getApiErrorMessage(e, "No se pudo anular la venta."));
    } finally {
      setAnulando(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <SectionHeader
        title={`Factura de venta #${id ?? "—"}`}
        subtitle="Consulta detallada de la venta registrada."
      />

      {created && (
        <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          La venta se registró correctamente.
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-[#121618] px-4 py-3 text-sm text-[#8B9AA0]">
          Cargando…
        </div>
      )}

      {err && !loading && (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {err}
        </div>
      )}

      {!loading && venta && (
        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#13171A] shadow-[0_30px_80px_rgba(0,0,0,.35)] ring-1 ring-black/20 print:bg-white print:text-black">
          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 print:border-black/10 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-[#8B9AA0] print:hidden">
                Venta #{venta.ventaID}
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white print:text-black">
                Factura de venta
              </h2>

              <div className="mt-2 flex items-center gap-2 text-sm text-[#8B9AA0] print:text-black/70">
                <span>Estado:</span>
                {estadoBadge}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Button
                type="button"
                variant="ghost"
                className="h-11 border border-white/10 bg-transparent px-4 text-sm text-white/80 hover:bg-white/5"
                onClick={() => router.push("/ventas/historial")}
              >
                ← Volver al historial
              </Button>

              <Button
                type="button"
                onClick={imprimir}
                variant="solid-emerald"
                className="h-11 px-5"
              >
                Imprimir
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-b border-white/10 px-6 py-5 print:border-black/10 md:grid-cols-3">
            <InfoBlock label="Cliente">
              <div className="text-base font-semibold">
                {venta.clienteNombre ?? "—"}
              </div>
              {venta.clienteCodigo && (
                <div className="mt-1 text-xs text-[#8B9AA0] print:text-black/65">
                  {venta.clienteCodigo}
                </div>
              )}
            </InfoBlock>

            <InfoBlock label="Fecha">
              <div className="text-sm font-medium">{fechaFmt(venta.fecha)}</div>
            </InfoBlock>

            <InfoBlock label="Observaciones">
              <div className="text-sm">{venta.observaciones ?? "—"}</div>
            </InfoBlock>
          </div>

          <div className="px-0 py-0 print:border-y print:border-black/20">
            <CardTable>
              <thead>
                <tr className="bg-[#1C2224] text-left text-[12px] uppercase tracking-[0.04em] text-[#8B9AA0] print:bg-black/5 print:text-black/70">
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
                    key={`${d.productoID ?? "row"}-${i}`}
                    className="hover:bg-white/[0.035] print:hover:bg-transparent"
                  >
                    <Td>{d.sku || "—"}</Td>
                    <Td>{d.descripcion || "—"}</Td>
                    <Td className="text-right">{d.cantidad}</Td>
                    <Td className="text-right">{formatMoney(d.precioUnitario)}</Td>
                    <Td className="text-right">{d.descuentoLineaPorcentaje ?? 0}</Td>
                    <Td className="text-right font-medium">{formatMoney(d.importe)}</Td>
                    <Td className="text-right">{d.bodegaID ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </CardTable>
          </div>

          <div className="border-t border-white/10 bg-white/[0.02] px-6 py-5 print:border-black/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
              <Tot label="Subtotal" value={venta.subtotal} />
              {typeof venta.descuento === "number" && !Number.isNaN(venta.descuento) && (
                <Tot label="Descuento" value={venta.descuento ?? 0} />
              )}
              <Tot label="Total" value={venta.total} strong />
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-white/10 px-6 py-4 print:hidden">
            <Button
              type="button"
              variant="danger"
              className="h-11 px-5"
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
        message={`¿Deseas anular la venta #${venta?.ventaID}? Esta acción devolverá el inventario a sus bodegas.`}
        confirmText="Sí, anular"
        onClose={() => setShowConfirmAnular(false)}
        onConfirm={anularVenta}
      />
    </div>
  );
}

const InfoBlock: React.FC<
  React.PropsWithChildren<{ label: string }>
> = ({ label, children }) => (
  <div className="rounded-2xl border border-white/10 bg-[#121618] p-4 shadow-sm print:border-black/10 print:bg-transparent">
    <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.04em] text-[#8B9AA0] print:text-black/65">
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
  <div
    className={
      strong
        ? "min-w-[150px] rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-3 text-right"
        : "min-w-[140px] rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right"
    }
  >
    <div className="text-xs text-[#8B9AA0] print:text-black/70">{label}</div>
    <div
      className={
        strong
          ? "mt-1 text-xl font-bold text-white print:text-black"
          : "mt-1 text-lg font-semibold text-[#E6E9EA] print:text-black"
      }
    >
      {formatMoney(value)}
    </div>
  </div>
);