"use client";
import * as React from "react";
import SectionHeader from "@/components/SectionHeader";
import CalendarMonth from "@/components/vencimientos/CalendarMonth";
import VencimientoFormModal from "@/components/vencimientos/VencimientoFormModal";
import AlertasTable from "@/components/vencimientos/AlertasTable";

const WINE = "#A30862";

export default function GestionarVencimientosPage() {
  const [modal, setModal] = React.useState<{
    open: boolean;
    initial:
      | {
          documentoVencimientoID?: number;
          titulo?: string;
          fechaISO?: string;
          tipoDocumentoID?: number;
        }
      | null;
  }>({ open: false, initial: null });

  const [refreshTick, setRefreshTick] = React.useState(0);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const openCreateModal = (fechaISO?: string) => {
    setModal({ open: true, initial: { fechaISO: fechaISO ?? "" } });
  };

  const openEditModal = (id: number) => {
    setModal({ open: true, initial: { documentoVencimientoID: id } });
  };

  const closeModal = () => setModal({ open: false, initial: null });

  const onSaved = (message?: string) => {
    setRefreshTick((t) => t + 1);
    setSuccessMessage(message ?? "Cambios guardados correctamente.");
    closeModal();
  };

  React.useEffect(() => {
    if (!successMessage) return;
    const id = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(id);
  }, [successMessage]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">
      <div className="mb-5">
        <SectionHeader
          title="Vencimientos"
          subtitle="Calendario y alertas de documentos"
        />
      </div>

      {successMessage && (
        <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200 shadow-sm backdrop-blur-sm">
          {successMessage}
        </div>
      )}

      <div className="mb-6">
        <CalendarMonth
          key={`cal-${refreshTick}`}
          onEdit={(id: number) => openEditModal(id)}
          onCreate={(dateISO: string) => openCreateModal(dateISO)}
        />
      </div>

      <div className="mb-12">
        <AlertasTable
          key={`al-${refreshTick}`}
          onEdit={openEditModal}
        />
      </div>

      <button
        type="button"
        onClick={() => openCreateModal()}
        className="fixed bottom-6 right-6 z-[1100] rounded-full px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,.28)] transition hover:scale-[1.02] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white/20"
        style={{ backgroundColor: WINE }}
      >
        + Agregar
      </button>

      <VencimientoFormModal
        open={modal.open}
        initial={modal.initial || undefined}
        onClose={closeModal}
        onSaved={onSaved}
      />
    </div>
  );
}