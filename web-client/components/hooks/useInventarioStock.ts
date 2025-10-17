import { useState, useCallback } from "react";
import { useApi } from "./useApi";

export type StockRow = {
  inventarioID: number;
  productoID: number;
  bodegaID: number;
  bodega: string;
  sku?: string | null;
  producto: string;
  existencia: number;
  reservada: number;
  disponible: number;
  fechaUltimaActualizacion: string;
};

export function useInventarioStock() {
  const { get } = useApi();
  const [rows, setRows]   = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadByProducto = useCallback(async (productoID: number) => {
    setLoading(true); setError(null);
    try {
      const data = await get<StockRow[]>(`/api/inventario/stock?productoId=${productoID}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo obtener el stock");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [get]);

  return { rows, loadByProducto, loading, error };
}
