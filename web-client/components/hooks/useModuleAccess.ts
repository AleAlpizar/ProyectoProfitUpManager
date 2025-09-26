"use client";

import { useApi } from "./useApi";
import { useCallback, useEffect, useState } from "react";

export function useModuleAccess(module = "Inventario", action: "Leer" | "Escribir" = "Leer") {
  const { call, loading, error, ready } = useApi();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const ok = await call<boolean>(`/api/inventario/access?module=${encodeURIComponent(module)}&action=${encodeURIComponent(action)}`, { method: "GET" });
    setAllowed(Boolean(ok));
  }, [call, module, action]);

  useEffect(() => {
    if (ready) load().catch(() => {});
  }, [ready, load]);

  return { allowed, loading, error, reload: load };
}
