import { useEffect, useRef, useState } from "react";
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
  const [data, setData] = useState<BodegaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = async () => {
    abortRef.current?.abort("reload");
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    try {
      const res = await get<Paged<BodegaDto>>(
        "/api/bodegas?soloActivas=false",
        { signal: ctrl.signal }
      );
      setData(res.items ?? []);
    } catch (e: any) {
      if (e?.name === "AbortError") return; 
      setError(e?.message || "Error al cargar bodegas");
      setData([]);
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort("unmount");
  }, []);

  return { data, loading, error, reload: load };
}

export default useBodegas;
