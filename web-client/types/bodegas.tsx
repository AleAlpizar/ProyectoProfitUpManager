export type Bodega = {
  bodegaId: number;
  codigo: string | null;
  nombre: string;
  direccion?: string | null;
  contacto?: string | null;
  isActive: boolean;
};

export type BodegaCreate = {
  codigo?: string;
  nombre: string;
  direccion?: string;
  contacto?: string;
};
