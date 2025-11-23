export type EstadoVto = "VENCIDO" | "PROXIMO" | "VIGENTE";

export type AlertRowDto = {
  documentoVencimientoID: number;
  titulo: string;
  tipoNombre: string;
  referencia?: string | null;
  fechaVencimiento: string; 
  notificarDiasAntes: number;
  daysToDue: number;
  estado: EstadoVto;
};

export type VencimientoDetalleDto = {
  documentoVencimientoID: number;
  titulo: string;
  descripcion?: string | null;
  tipoDocumentoVencimientoID: number;
  tipoNombre: string;
  referencia?: string | null;
  fechaEmision?: string | null;      
  fechaVencimiento: string;         
  notificarDiasAntes: number;
  isActive: boolean;
};

export type VencimientoUpdateDto = {
  titulo: string;
  descripcion?: string | null;
  tipoDocumentoVencimientoID: number;
  referencia?: string | null;
  fechaEmision?: string | null;
  fechaVencimiento: string; 
  notificarDiasAntes: number;
  isActive: boolean;
};

export type TipoDocumentoVtoDto = {
  tipoDocumentoVencimientoID: number;
  nombre: string;
  descripcion?: string | null;
  isActive: boolean;
};
