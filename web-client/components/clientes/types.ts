export type Estado = "Activo" | "Inactivo";

export type TipoDePersona = "Natural" | "Juridico";

export interface Cliente {
  clienteID?: number;
  codigoCliente?: string | null;
  nombre: string;
  tipoPersona: TipoDePersona;     
  identificacion?: string | null;
  correo: string;
  telefono?: string | null;
  direccion?: string | null;

  fechaRegistro?: string | null;
  isActive: boolean;

  createdAt?: string | null;
  createdBy?: number | null;
  updatedAt?: string | null;
  updatedBy?: number | null;

  descuentoPorcentaje: number;
  descuentoDescripcion?: string | null;
}
