import { useApi } from "./useApi";

export type ProductoCreateDto = {
  SKU?: string | null;
  Nombre: string;
  Descripcion?: string | null;
  CodigoInterno?: string | null;
  UnidadAlmacenamientoID?: number | null;
  PrecioCosto?: number | null;
  PrecioVenta: number;
  Peso?: number | null;
  Largo?: number | null;
  Alto?: number | null;
  Ancho?: number | null;
};

export function useProducts() {
  const { call, loading, error } = useApi();

  async function create(dto: ProductoCreateDto) {
    return call<{ productoId: number; message: string }>(`/api/productos`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  }

  return { create, loading, error };
}
