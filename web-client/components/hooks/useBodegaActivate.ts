import { useState } from "react";
import { useApi } from "./useApi";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message?.trim()) return error.message.trim();
  return fallback;
}

export function useBodegaActivate() {
  const { post } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activate = async (id: number) => {
    if (!Number.isInteger(id) || id <= 0) {
      setError("El identificador de la bodega no es válido.");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await post<void>(`/api/bodegas/${id}/reactivar`);
      return true;
    } catch (e: unknown) {
      setError(getErrorMessage(e, "No se pudo activar la bodega."));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { activate, loading, error };
}