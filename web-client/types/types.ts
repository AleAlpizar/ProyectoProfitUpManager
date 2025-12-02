export type ProductoDisponibilidadDto = {
    nombre: string;
    id: string;
    cantidad: number;
    productoId: number;
  };
export type ProductoInLine = {
  productoID: number;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  descuento?: number | null;
  precioVenta?: number;
  bodegas?: ProductoDisponibilidadDto[];
};