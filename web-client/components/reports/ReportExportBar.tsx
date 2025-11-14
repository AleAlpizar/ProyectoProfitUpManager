"use client";

import { Button } from "@nextui-org/react";
import { useMemo, useState } from "react";
import { useReportExport } from "@/components/hooks/useReportExport";
import { ReportRegisterDto } from "@/lib/reports";

type Props = {
  reportData?: ReportRegisterDto;
  reportKey?: string;
  fileName?: string;
  getToken?: () => string | null;
};

export default function ReportExportBar({
  reportData,
  reportKey,
  fileName = "Reporte",
  getToken,
}: Props) {
  const { busy, error, register, exportExcel, exportPdf } = useReportExport({ getToken });
  const disabled = useMemo(() => busy !== "none", [busy]);
  const [message, setMessage] = useState<string | null>(null);

  async function ensureRegistered(): Promise<string> {
    if (reportKey) return reportKey;
    if (reportData && reportData.rows?.length) {
      const key = await register({
        key: reportData.key ?? "default",
        title: reportData.title,
        columnOrder: reportData.columnOrder,
        rows: reportData.rows,
      });
      return key;
    }
    return "default";
  }

  async function handleExcel() {
    setMessage(null);
    const key = await ensureRegistered();
    const ok = await exportExcel(key, fileName);
    if (!ok) {
      setMessage(error === "NO_REPORT"
        ? "Primero genera un reporte para poder exportarlo."
        : "No se pudo completar la exportación. Intenta nuevamente.");
    }
  }

  async function handlePdf() {
    setMessage(null);
    const key = await ensureRegistered();
    const ok = await exportPdf(key, fileName);
    if (!ok) {
      setMessage(error === "NO_REPORT"
        ? "Primero genera un reporte para poder exportarlo."
        : "No se pudo completar la exportación. Intenta nuevamente.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" flat onClick={handleExcel} disabled={disabled}>
        Exportar Excel
      </Button>
      <Button size="sm" color="primary" onClick={handlePdf} disabled={disabled}>
        Exportar PDF
      </Button>
      {message && <span className="text-sm text-warning ml-2">{message}</span>}
    </div>
  );
}