import { useState } from "react";
import { useApi } from "./useApi";

export function useBodegaDelete() {
  const { del } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inactivate = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del<void>(`/api/bodegas/${id}`);
      return true;
    } catch (e: any) {
      setError(e?.message ?? "No se pudo inactivar la bodega");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { inactivate, loading, error };
}
