export type CalEstado = "VENCIDO" | "PROXIMO" | "VIGENTE";

export type CalEvent = {
  documentoVencimientoID: number;
  titulo: string;
  tipoNombre: string;
  fechaVencimiento: string; 
  estado: CalEstado;
  descripcion?: string | null;
};
