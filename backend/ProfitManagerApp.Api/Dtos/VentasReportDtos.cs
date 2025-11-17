using System;

namespace ProfitManagerApp.Api.Dtos
{

    public sealed class VentasRendimientoDiaDto
    {
        public DateTime Fecha { get; set; }
        public int CantidadVentas { get; set; }
        public decimal MontoTotal { get; set; }
        public decimal TicketPromedio { get; set; }
    }

    public sealed class VentasRendimientoMesDto
    {
        public int Anio { get; set; }
        public int Mes { get; set; }
        public int CantidadVentas { get; set; }
        public decimal MontoTotal { get; set; }
        public decimal TicketPromedio { get; set; }
    }

    public sealed class VentasTopProductoDto
    {
        public int ProductoID { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public decimal CantidadVendida { get; set; }
        public decimal MontoVendido { get; set; }
        public decimal MargenBruto { get; set; }
    }

    public sealed class ProductoSinMovimientoDto
    {
        public int ProductoID { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
    }

    public sealed class VentasPorBodegaDto
    {
        public int BodegaID { get; set; }
        public string NombreBodega { get; set; } = string.Empty;
        public decimal CantidadVendida { get; set; }
        public decimal MontoVendido { get; set; }
    }

    public sealed class RotacionInventarioDto
    {
        public int ProductoID { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public decimal CantidadVendida { get; set; }
        public decimal StockActual { get; set; }
        public decimal IndiceRotacion { get; set; }
    }


    public sealed class VentaStockIssueDto
    {
        public int ProductoID { get; set; }
        public int BodegaID { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string NombreProducto { get; set; } = string.Empty;
        public decimal StockActual { get; set; }
        public decimal CantidadVendidaPeriodo { get; set; }
        public decimal IndiceCriticidad { get; set; }
    }

    public sealed class AnulacionPorUsuarioDto
    {
        public int UsuarioID { get; set; }
        public int CantidadAnulaciones { get; set; }
        public decimal MontoTotalAnulado { get; set; }
    }

    public sealed class VentaAnulacionDetalleDto
    {
        public int AnulacionID { get; set; }
        public int VentaID { get; set; }
        public DateTime FechaAnulacion { get; set; }
        public string? Motivo { get; set; }
        public int? UsuarioID { get; set; }
        public decimal TotalVenta { get; set; }
    }


    public sealed class VentasDashboardDto
    {
        public DateTime? FechaDesde { get; set; }
        public DateTime? FechaHasta { get; set; }

        public int TotalVentas { get; set; }
        public decimal MontoTotal { get; set; }
        public decimal TicketPromedioGlobal { get; set; }

        public List<VentasRendimientoDiaDto> PorDia { get; set; } = new();
        public List<VentasRendimientoMesDto> PorMes { get; set; } = new();

        public List<VentasTopProductoDto> TopProductos { get; set; } = new();
        public List<ProductoSinMovimientoDto> ProductosSinMovimiento { get; set; } = new();
        public List<VentasPorBodegaDto> VentasPorBodega { get; set; } = new();
        public List<RotacionInventarioDto> RotacionInventario { get; set; } = new();

        public List<VentaStockIssueDto> PosiblesProblemasStock { get; set; } = new();

        public List<AnulacionPorUsuarioDto> AnulacionesPorUsuario { get; set; } = new();
        public List<VentaAnulacionDetalleDto> AnulacionesDetalle { get; set; } = new();
    }
}
