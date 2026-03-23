"use client";

import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import Button from "@/components/buttons/button";
import { useApi } from "@/components/hooks/useApi";
import { formatMoney } from "@/helpers/ui-helpers";
import { useRouter } from "next/router";
import { CardTable, Th, Td } from "@/components/ui/table";
import ConfirmDialog from "@/components/ConfirmDialog";

type Detalle = {
  productoID?: number | null;
  sku: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
};

type OrdenEstado = "Pendiente" | "Anulada" | "Hecha";

type OrdenCompraGetDto = {
  ordenCompraID: number;
  codigoOrden?: string | null;
  proveedorID: number;
  proveedorNombre: string;
  fechaSolicitud: string;
  fechaEstimada?: string | null;
  total: number;
  observaciones?: string | null;
  estado: OrdenEstado;
  detalles: Detalle[];
};

export default function OrdenCompraDetallePage() {
  const router = useRouter();
  const { call } = useApi();

  const [orden, setOrden] = useState<OrdenCompraGetDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [anulando, setAnulando] = useState(false);
  const [showConfirmAnular, setShowConfirmAnular] = useState(false);

  const getRawId = (): string | undefined => {
    const q = router.query.id;
    if (!q) return undefined;
    return Array.isArray(q) ? q[0] : q;
  };

  useEffect(() => {
    if (!router.isReady) return;

    const created = router.query.created;
    const createdValue = Array.isArray(created) ? created[0] : created;

    if (createdValue === "1") {
      setSuccessMsg("La orden de compra fue registrada correctamente.");
    }
  }, [router.isReady, router.query.created]);

  useEffect(() => {
    if (!router.isReady) return;

    const rawId = getRawId();
    if (!rawId) {
      setErr("ID de orden inválido.");
      return;
    }

    const numericId = Number(rawId);
    if (!numericId || Number.isNaN(numericId)) {
      setErr("ID de orden inválido.");
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const data = await call<OrdenCompraGetDto>(
          `/api/ordenes-compra/${numericId}`,
          { method: "GET" }
        );

        if (alive) {
          setOrden(data ?? null);
        }
      } catch (e: any) {
        if (alive) {
          setErr(e?.message ?? "No se pudo obtener la orden de compra.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [router.isReady, router.query.id, call]);

  const fechaFmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString("es-CR") : "—";

  const estadoBadge = useMemo(() => {
    if (!orden) return null;

    if (orden.estado === "Hecha") {
      return (
        <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200 shadow-sm">
          Hecha
        </span>
      );
    }

    if (orden.estado === "Anulada") {
      return (
        <span className="rounded-full border border-rose-400/40 bg-rose-400/10 px-2.5 py-1 text-[11px] font-medium text-rose-200 shadow-sm">
          Anulada
        </span>
      );
    }

    return (
      <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 shadow-sm">
        Pendiente
      </span>
    );
  }, [orden]);

  const puedeAnular = orden?.estado === "Pendiente";

  const anularOrden = async () => {
    if (!orden?.ordenCompraID) return;

    setAnulando(true);
    setErr(null);
    setSuccessMsg(null);

    try {
      const res = await call<{ message?: string; estado?: OrdenEstado }>(
        `/api/ordenes-compra/${orden.ordenCompraID}`,
        {
          method: "DELETE",
        }
      );

      setOrden((prev) =>
        prev
          ? {
              ...prev,
              estado: (res?.estado as OrdenEstado) ?? "Anulada",
            }
          : prev
      );

      setSuccessMsg(res?.message ?? "La orden fue anulada correctamente.");
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo anular la orden.");
    } finally {
      setAnulando(false);
    }
  };

  const rawIdForTitle = getRawId();

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-5">
        <SectionHeader
          title={`Orden de compra #${rawIdForTitle ?? "—"}`}
          subtitle="Detalle de la orden de compra"
        />
      </div>

      {successMsg && (
        <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 shadow-sm">
          {successMsg}
        </div>
      )}

      {!router.isReady && (
        <div className="mt-4 rounded-3xl border border-white/10 bg-[#13171A] p-6 text-sm text-[#8B9AA0] shadow-[0_18px_50px_rgba(0,0,0,.22)]">
          Cargando…
        </div>
      )}

      {loading && router.isReady && (
        <div className="mt-4 rounded-3xl border border-white/10 bg-[#13171A] p-6 text-sm text-[#8B9AA0] shadow-[0_18px_50px_rgba(0,0,0,.22)]">
          Cargando…
        </div>
      )}

      {err && !loading && router.isReady && (
        <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 shadow-sm">
          {err}
        </div>
      )}

      {!loading && router.isReady && orden && (
        <section className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-[#13171A] shadow-[0_30px_80px_rgba(0,0,0,.45)] ring-1 ring-black/20 print:bg-white print:text-black">
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] text-[#8B9AA0] print:hidden">
                Orden #{orden.ordenCompraID}
              </div>

              <h2 className="mt-3 text-xl font-semibold text-white print:text-black">
                Orden de compra
              </h2>

              <div className="mt-2 flex items-center gap-2 text-xs text-[#8B9AA0] print:text-black/70">
                <span>Estado:</span>
                {estadoBadge}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Button
                type="button"
                variant="ghost"
                className="border border-white/10 bg-transparent text-xs text-white/80 hover:bg-white/5"
                onClick={() => router.push("/compras")}
              >
                ← Volver
              </Button>

              <Button
                type="button"
                onClick={() => window.print()}
                variant="solid-emerald"
              >
                Imprimir
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-white/10 px-5 py-5 md:grid-cols-2 xl:grid-cols-4 print:border-t print:border-black/10">
            <InfoBlock label="Código de orden">
              <div className="font-semibold">{orden.codigoOrden ?? "—"}</div>
            </InfoBlock>

            <InfoBlock label="Proveedor">
              <div className="font-semibold">{orden.proveedorNombre ?? "—"}</div>
            </InfoBlock>

            <InfoBlock label="Fecha solicitud">
              {fechaFmt(orden.fechaSolicitud)}
            </InfoBlock>

            <InfoBlock label="Fecha estimada">
              {fechaFmt(orden.fechaEstimada)}
            </InfoBlock>
          </div>

          <div className="px-5 pb-5">
            <InfoBlock label="Observaciones">
              <div className="min-h-[24px] leading-relaxed">
                {orden.observaciones?.trim() ? orden.observaciones : "—"}
              </div>
            </InfoBlock>
          </div>

          <div className="border-t border-white/10 print:border-y print:border-black/20">
            <CardTable>
              <thead>
                <tr className="bg-[#1B2025] text-left text-xs uppercase tracking-wide text-[#8B9AA0] print:bg-black/5 print:text-black/70">
                  <Th>SKU</Th>
                  <Th>Descripción</Th>
                  <Th className="text-right">Cant.</Th>
                  <Th className="text-right">P. Unit</Th>
                  <Th className="text-right">Importe</Th>
                </tr>
              </thead>

              <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-white/10 print:[&>tr]:border-black/10">
                {orden.detalles.length > 0 ? (
                  orden.detalles.map((d, i) => (
                    <tr
                      key={`${d.productoID ?? "item"}-${i}`}
                      className="transition hover:bg-white/[0.04] print:hover:bg-transparent"
                    >
                      <Td>{d.sku || "—"}</Td>
                      <Td>
                        <div className="max-w-[420px] leading-relaxed">
                          {d.descripcion || "—"}
                        </div>
                      </Td>
                      <Td className="text-right">{d.cantidad}</Td>
                      <Td className="text-right">
                        {formatMoney(d.precioUnitario)}
                      </Td>
                      <Td className="text-right">
                        <span className="font-semibold text-white print:text-black">
                          {formatMoney(d.importe)}
                        </span>
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-[#8B9AA0]"
                    >
                      La orden no tiene líneas de detalle registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </CardTable>
          </div>

          <div className="flex flex-col items-end gap-6 border-t border-white/10 px-5 py-5 sm:flex-row sm:justify-end">
            <Tot label="Total" value={orden.total} strong />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4 print:hidden">
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowConfirmAnular(true)}
              disabled={anulando || !puedeAnular}
            >
              {anulando ? "Anulando…" : "Anular orden"}
            </Button>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={showConfirmAnular}
        title="Anular orden de compra"
        message={`¿Deseas anular la orden #${orden?.ordenCompraID}? Este cambio no es reversible.`}
        confirmText="Sí, anular"
        onClose={() => setShowConfirmAnular(false)}
        onConfirm={async () => {
          await anularOrden();
          setShowConfirmAnular(false);
        }}
      />
    </div>
  );
}

const InfoBlock: React.FC<
  React.PropsWithChildren<{ label: string }>
> = ({ label, children }) => (
  <div className="rounded-2xl border border-white/10 bg-[#121618] p-4 shadow-sm print:border-black/10 print:bg-transparent">
    <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8B9AA0] print:text-black/70">
      {label}
    </div>
    <div className="text-sm text-[#E6E9EA] print:text-black">{children}</div>
  </div>
);

const Tot: React.FC<{ label: string; value: number; strong?: boolean }> = ({
  label,
  value,
  strong,
}) => (
  <div className="text-right">
    <div className="mb-1 text-xs uppercase tracking-wide text-[#8B9AA0] print:text-black/70">
      {label}
    </div>
    <div
      className={
        strong
          ? "text-2xl font-bold text-white print:text-black"
          : "font-semibold text-[#E6E9EA] print:text-black"
      }
    >
      {formatMoney(value)}
    </div>
  </div>
);