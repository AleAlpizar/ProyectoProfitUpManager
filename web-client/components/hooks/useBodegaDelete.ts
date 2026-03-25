import { useState } from "react";
import { useApi } from "./useApi";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message?.trim()) return error.message.trim();
  return fallback;
}

export function useBodegaDelete() {
  const { del } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inactivate = async (id: number) => {
    if (!Number.isInteger(id) || id <= 0) {
      setError("El identificador de la bodega no es válido.");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await del<void>(`/api/bodegas/${id}`);
      return true;
    } catch (e: unknown) {
      setError(getErrorMessage(e, "No se pudo inactivar la bodega."));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { inactivate, loading, error };
}