import { useState } from "react";
import { useApi } from "./useApi";

export function useBodegaActivate() {
  const { post } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const activate = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await post<void>(`/api/bodegas/${id}/reactivar`);
      return true;
    } catch (e: any) {
      setError(e?.message ?? "No se pudo activar la bodega");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { activate, loading, error };
}
