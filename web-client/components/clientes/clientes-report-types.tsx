export type ClienteComprasMensualesPoint = {
  anio: number;
  mes: number;
  totalClientes: number;
  totalVentas: number;
  montoTotal: number;
};

export type ClienteTopPoint = {
  clienteID: number;
  totalVentas: number;
  montoTotal: number;
  ticketPromedio: number;
  ultimaCompra: string;
};

export type ClienteInactivoPoint = {
  clienteID: number;
  totalVentas: number;
  montoTotal: number;
  ultimaCompra: string;
  mesesSinCompra: number;
};

export type ClienteVentaDetallePoint = {
  ventaID: number;
  fecha: string;
  subTotal: number;
  descuento: number;
  total: number;
  cantidadLineas: number;
};
