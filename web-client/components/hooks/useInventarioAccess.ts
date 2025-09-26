"use client";

import { useApi } from "./useApi";
import { useCallback, useEffect, useState } from "react";

type AccessResponse = { allowed: boolean };

export function useInventarioAccess(accion: "Leer" | "Escribir" = "Leer") {
  const { call, loading: calling, error: apiError, ready } = useApi();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await call<AccessResponse>(`/api/inventario/access?accion=${accion}`, {
        method: "GET",
      });
      setAllowed(Boolean(data?.allowed));
    } catch (e: any) {
      setError(e?.message || "No se pudo validar el acceso.");
      setAllowed(null);
    } finally {
      setLoading(false);
    }
  }, [accion, call]);

  useEffect(() => {
    if (ready) check().catch(() => {});
  }, [ready, check]);

  return {
    allowed,            
    loading: loading || calling,
    error: error || apiError || null,
    reload: check,
  };
}
