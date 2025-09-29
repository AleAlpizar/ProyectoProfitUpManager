export type Estado = "Activo" | "Inactivo";
export type TipoDePersona = "Natural" | "Juridico";
export type Cliente = {
  id?: number;
  codigoCliente: string;
  nombre: string;
  tipoPersona: TipoDePersona;
  identificacion: string;
  correo: string;
  telefono: string;
  direccion: string;
  isActive: boolean;

};
