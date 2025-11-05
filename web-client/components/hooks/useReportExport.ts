import { useState, useCallback } from "react";
import {
  registerReport,
  exportExcel,
  exportPdf,
  type ReportRegisterDto,
} from "@/lib/reports";

function downloadBlob(blob: Blob, suggestedName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type UseReportExportOptions = {
  getToken?: () => string | null;
};

export function useReportExport(opts?: UseReportExportOptions) {
  const [busy, setBusy] = useState<"none" | "register" | "excel" | "pdf">(
    "none"
  );
  const [error, setError] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string>("default");

  const doRegister = useCallback(
    async (dto: ReportRegisterDto) => {
      setError(null);
      setBusy("register");
      try {
        const { key } = await registerReport(dto, opts?.getToken);
        setLastKey(key);
        return key;
      } finally {
        setBusy("none");
      }
    },
    [opts?.getToken]
  );

  const doExportExcel = useCallback(
    async (key?: string, fileName?: string) => {
      setError(null);
      setBusy("excel");
      try {
        const k = key ?? lastKey;
        const blob = await exportExcel(k, opts?.getToken);
        downloadBlob(blob, (fileName ?? "Reporte") + ".xlsx");
        return true;
      } catch (e: any) {
        setError(e?.message === "NO_REPORT" ? "NO_REPORT" : "EXPORT_FAILED");
        return false;
      } finally {
        setBusy("none");
      }
    },
    [lastKey, opts?.getToken]
  );

  const doExportPdf = useCallback(
    async (key?: string, fileName?: string) => {
      setError(null);
      setBusy("pdf");
      try {
        const k = key ?? lastKey;
        const blob = await exportPdf(k, opts?.getToken);
        downloadBlob(blob, (fileName ?? "Reporte") + ".pdf");
        return true;
      } catch (e: any) {
        setError(e?.message === "NO_REPORT" ? "NO_REPORT" : "EXPORT_FAILED");
        return false;
      } finally {
        setBusy("none");
      }
    },
    [lastKey, opts?.getToken]
  );

  return {
    busy,
    error, 
    lastKey,
    register: doRegister,
    exportExcel: doExportExcel,
    exportPdf: doExportPdf,
  };
}
