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

  const openCreateModal = (fechaISO?: string) => {
    setModal({ open: true, initial: { fechaISO: fechaISO ?? "" } });
  };

  const openEditModal = (id: number) => {
    setModal({ open: true, initial: { documentoVencimientoID: id } });
  };

  const closeModal = () => setModal({ open: false, initial: null });

  const onSaved = () => {
    setRefreshTick((t) => t + 1);
    closeModal();
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <SectionHeader title="Vencimientos" subtitle="Calendario y alertas de documentos" />

      <div className="mb-6">
        <CalendarMonth
          key={`cal-${refreshTick}`}
          onEdit={(id: number) => openEditModal(id)}
          onCreate={(dateISO: string) => openCreateModal(dateISO)}
        />
      </div>

      <div className="mb-10">
        <AlertasTable key={`al-${refreshTick}`} onEdit={openEditModal} />
      </div>

      <button
        type="button"
        onClick={() => openCreateModal()}
        className="fixed bottom-6 right-6 z-[1100] rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95"
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
