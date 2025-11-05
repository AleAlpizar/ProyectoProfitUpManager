export type ReportRegisterDto = {
  key?: string;
  title: string;
  columnOrder?: string[];
  rows: Array<Record<string, any>>;
};

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

function authHeaders(getToken?: () => string | null): Record<string, string> {
  const h: Record<string, string> = {};
  const token = getToken?.();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function registerReport(
  dto: ReportRegisterDto,
  getToken?: () => string | null
) {
  const res = await fetch(`${BASE}/api/reports/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(getToken),
    } as Record<string, string>,
    body: JSON.stringify({
      key: dto.key ?? "default",
      title: dto.title,
      columnOrder: dto.columnOrder,
      rows: dto.rows,
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "No se pudo registrar el reporte");
  }
  return (await res.json()) as { message: string; key: string };
}

async function exportBlob(
  key: string,
  kind: "excel" | "pdf",
  getToken?: () => string | null
) {
  const url =
    kind === "excel"
      ? `${BASE}/api/reports/${encodeURIComponent(key)}/export/excel`
      : `${BASE}/api/reports/${encodeURIComponent(key)}/export/pdf`;

  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(getToken) as Record<string, string>,
  });

  if (!res.ok) {
    let code = "EXPORT_FAILED";
    try {
      const data = await res.json();
      code = (data?.code as string) || code;
    } catch {}
    if (code === "NO_REPORT") throw new Error("NO_REPORT");
    throw new Error("EXPORT_FAILED");
  }
  return await res.blob();
}

export async function exportExcel(key: string, getToken?: () => string | null) {
  return await exportBlob(key, "excel", getToken);
}

export async function exportPdf(key: string, getToken?: () => string | null) {
  return await exportBlob(key, "pdf", getToken);
}
