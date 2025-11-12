const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function registerUsersReport(
  authHeader: Record<string, string>,
  opts: { q?: string; estado?: string; rol?: string; key?: string; title?: string } = {}
) {
  const params = new URLSearchParams();
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.estado && opts.estado !== "Todos") params.set("estado", opts.estado);
  if (opts.rol && opts.rol !== "Todos") params.set("rol", opts.rol);
  params.set("key", opts.key ?? "usuarios");
  params.set("title", opts.title ?? "Usuarios");

  const url = `${API}/api/reports/users/register-from-db?${params.toString()}`;
  const res = await fetch(url, { method: "GET", headers: { ...authHeader } });
  if (!res.ok) throw new Error(await res.text());
}

export async function exportUsersPdf(authHeader: Record<string, string>, key = "usuarios") {
  const url = `${API}/api/reports/${encodeURIComponent(key)}/export/pdf`;
  const res = await fetch(url, { method: "POST", headers: { ...authHeader } });
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
