export const VENC_API = {
  tipos: "/api/vencimientos/tipos",
  create: "/api/vencimientos",
  list: (p?: { page?: number; pageSize?: number; q?: string; tipoID?: number; soloPendientes?: boolean }) => {
    const u = new URLSearchParams();
    if (p?.page) u.set("page", String(p.page));
    if (p?.pageSize) u.set("pageSize", String(p.pageSize));
    if (p?.q) u.set("q", p.q);
    if (p?.tipoID) u.set("tipoID", String(p.tipoID));
    if (p?.soloPendientes != null) u.set("soloPendientes", String(p.soloPendientes));
    const qs = u.toString();
    return qs ? `/api/vencimientos?${qs}` : `/api/vencimientos`;
  },
  get: (id: number) => `/api/vencimientos/${id}`,
  update: (id: number) => `/api/vencimientos/${id}`,
  delete: (id: number) => `/api/vencimientos/${id}`,
};
