export type Estado = "Activo" | "Inactivo";
export type Cliente = {
  id?: string;
  nombre: string;
  email: string;
  estado: Estado;
  totalCompras: number; // mejor numérico para cálculos
  descuento?: number;   // porcentaje 0..100
};