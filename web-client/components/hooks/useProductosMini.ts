import * as React from "react";
import { useApi } from "./useApi";

export type ProductoMini = {
  productoID: number;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  descuento?: number | null;
  precioVenta?: number;
};

export function useProductosMini() {
  const { get } = useApi();
  const [data, setData] = React.useState<ProductoMini[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const items = await get<ProductoMini[]>("/api/productos/mini");
      setData(items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar productos");
    } finally {
      setLoading(false);
    }
  }, [get]);

  React.useEffect(() => { load().catch(() => {}); }, [load]);

  return { data, load, loading, error };
}
