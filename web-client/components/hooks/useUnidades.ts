import { useEffect, useState } from "react";
import { useApi } from "./useApi";

export type UnidadDto = {
  unidadID: number;
  codigo: string | null;
  nombre: string | null;
  activo: boolean | number;
};

export function useUnidades() {
  const { get } = useApi();
  const [data, setData] = useState<UnidadDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get<UnidadDto[]>("/api/unidades");
      setData(res ?? []);
    } catch (e: any) {
      setError(e?.message || "Error al cargar unidades");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { data, loading, error, reload: load };
}

export default useUnidades;
