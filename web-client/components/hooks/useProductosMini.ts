"use client";

import { useApi } from "./useApi";
import { useCallback, useEffect, useState } from "react";

export type ProductoMini = {
  productoID: number;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
};

export function useProductosMini() {
  const { call, loading, error, ready } = useApi();
  const [data, setData] = useState<ProductoMini[]>([]);

  const load = useCallback(async () => {
    const rows = await call<ProductoMini[]>("/api/inventario/productos/mini", {
      method: "GET",
    });
    setData(rows);
  }, [call]);

  useEffect(() => {
    if (ready) load().catch(() => {});
  }, [ready, load]);

  return { data, load, loading, error };
}



