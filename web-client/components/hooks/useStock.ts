import { useApi } from "./useApi";
import { useCallback, useEffect, useState } from "react";

export type StockRow = {
  bodega: string;
  producto: string;
  sku: string;
  existencia: number;
  disponible: number;
};

export function useStock() {
  const { call, loading, error, ready } = useApi(); 
  const [rows, setRows] = useState<StockRow[]>([]);

  const load = useCallback(
    async (params?: { productoId?: number; bodegaId?: number }) => {
      const qs = new URLSearchParams();
      if (params?.productoId) qs.set("productoId", String(params.productoId));
      if (params?.bodegaId) qs.set("bodegaId", String(params.bodegaId));
      const url = `/api/inventario/stock${qs.toString() ? `?${qs.toString()}` : ""}`;
      const data = await call<StockRow[]>(url, { method: "GET" });
      setRows(data);
    },
    [call]
  );

  useEffect(() => {
    if (ready) {
      load().catch(() => {}); 
    }
  }, [ready, load]);

  return { rows, load, loading, error, setRows };
}
