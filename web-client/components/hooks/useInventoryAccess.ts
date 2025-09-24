import { useEffect, useState } from "react";
import { useApi } from "./useApi";

export function useInventoryAccess(accion: "Leer" | "Escribir" = "Leer") {
  const { call, loading, error } = useApi();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await call<{ allowed: boolean }>(
          `/api/inventario/acceso?modulo=Inventario&accion=${accion}`
        );
        setAllowed(r.allowed);
      } catch (e: any) {
        if (e?.status === 403) setAllowed(false);
        else setAllowed(null);
      }
    })();
  }, [accion, call]);

  return { allowed, loading, error };
}
