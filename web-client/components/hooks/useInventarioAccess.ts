"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "./useApi";

type AccessResponse = {
  allowed?: boolean;
  canRead?: boolean;
  canWrite?: boolean;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useInventarioAccess(accion: "Leer" | "Escribir" = "Leer") {
  const { call, loading: calling, error: apiError, ready } = useApi();

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await call<AccessResponse>(
        `/api/inventario/access?accion=${encodeURIComponent(accion)}`,
        {
          method: "GET",
        }
      );

      const nextCanRead =
        typeof data?.canRead === "boolean"
          ? data.canRead
          : accion === "Leer"
          ? Boolean(data?.allowed)
          : false;

      const nextCanWrite =
        typeof data?.canWrite === "boolean"
          ? data.canWrite
          : accion === "Escribir"
          ? Boolean(data?.allowed)
          : false;

      const nextAllowed =
        typeof data?.allowed === "boolean"
          ? data.allowed
          : accion === "Escribir"
          ? nextCanWrite
          : nextCanRead;

      setCanRead(nextCanRead);
      setCanWrite(nextCanWrite);
      setAllowed(nextAllowed);
    } catch (e: unknown) {
      const message = getErrorMessage(e, "No se pudo validar el acceso.");
      setError(message);
      setAllowed(null);
      setCanRead(false);
      setCanWrite(false);
    } finally {
      setLoading(false);
    }
  }, [accion, call]);

  useEffect(() => {
    if (!ready) return;
    check().catch(() => {});
  }, [ready, check]);

  return {
    allowed,
    canRead,
    canWrite,
    loading: loading || calling,
    error: error || apiError || null,
    reload: check,
  };
}