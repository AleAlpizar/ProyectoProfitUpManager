import * as React from "react";
import { useApi } from "./useApi";

export type BodegaDto = {
  bodegaID: number;
  codigo?: string | null;
  nombre: string;
  direccion?: string | null;
  contacto?: string | null;
  isActive: boolean | number;
};

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export function useBodegas() {
  const { get } = useApi();
  const [data, setData] = React.useState<BodegaDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await get<Paged<BodegaDto>>("/api/bodegas?soloActivas=true&page=1&pageSize=1000");
      setData(res?.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar bodegas");
    } finally {
      setLoading(false);
    }
  }, [get]);

  React.useEffect(() => { load().catch(() => {}); }, [load]);

  return { data, load, loading, error };
}
