"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "./useApi";

type AccessDto = { canRead: boolean; canWrite: boolean };

export function useInventarioAccess() {
  const { call, loading, error, ready } = useApi();
  const [access, setAccess] = useState<AccessDto | null>(null);

  const reload = useCallback(async () => {
    const data = await call<AccessDto>("/api/inventario/access", { method: "GET" });
    setAccess(data);
  }, [call]);

  useEffect(() => {
    if (ready) reload().catch(() => {});
  }, [ready, reload]);

  return {
    loading,
    error,
    reload,
    canRead: !!access?.canRead,
    canWrite: !!access?.canWrite,
  };
}
