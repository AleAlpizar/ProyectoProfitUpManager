using System;
using System.Collections.Generic;

namespace ProfitManagerApp.Api.Dtos
{
    public sealed class StockActualRowDto
    {
        public int ProductoID { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string NombreProducto { get; set; } = string.Empty;
        public int BodegaID { get; set; }
        public string NombreBodega { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public decimal PrecioCosto { get; set; }
        public decimal ValorCosto { get; set; }
    }

    public sealed class StockCriticoRowDto
    {
        public int ProductoID { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string NombreProducto { get; set; } = string.Empty;
        public int BodegaID { get; set; }
        public string NombreBodega { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public decimal Umbral { get; set; }
        public bool EsCero => Cantidad <= 0;
    }

    public sealed class InventarioValorizadoRowDto
    {
        public int ProductoID { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string NombreProducto { get; set; } = string.Empty;
        public int BodegaID { get; set; }
        public string NombreBodega { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }

        public decimal PrecioCosto { get; set; }
        public decimal PrecioVenta { get; set; }
        public decimal Descuento { get; set; }

        public decimal ValorCosto { get; set; }
        public decimal ValorVenta { get; set; }
        public decimal MargenPotencial { get; set; }
    }

    public sealed class KardexMovimientoDto
    {
        public long MovimientoID { get; set; }
        public DateTime FechaMovimiento { get; set; }
        public string TipoMovimiento { get; set; } = string.Empty;
        public int ProductoID { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string NombreProducto { get; set; } = string.Empty;
        public int BodegaID { get; set; }
        public string NombreBodega { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public string? Motivo { get; set; }
        public string? ReferenciaTipo { get; set; }
        public int? UsuarioID { get; set; }
    }

    public sealed class MovimientoResumenDto
    {
        public string TipoMovimiento { get; set; } = string.Empty;
        public int CantidadMovimientos { get; set; }
        public decimal CantidadTotal { get; set; }
    }

    public sealed class RotacionInventarioSimpleDto
    {
        public int ProductoID { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string NombreProducto { get; set; } = string.Empty;
        public decimal CantidadVendidaPeriodo { get; set; }
        public decimal StockActual { get; set; }
        public decimal Rotacion { get; set; }
    }

    public sealed class ProductoSinMovimientoInvDto
    {
        public int ProductoID { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string NombreProducto { get; set; } = string.Empty;
        public DateTime? FechaCreacion { get; set; }
    }

    public sealed class CoberturaInventarioDto
    {
        public int ProductoID { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string NombreProducto { get; set; } = string.Empty;

        public decimal StockActual { get; set; }
        public decimal ConsumoPromedioDia { get; set; }
        public decimal DiasCobertura { get; set; }
    }

    public sealed class InventarioDashboardDto
    {
        public DateTime? FechaDesde { get; set; }
        public DateTime? FechaHasta { get; set; }

        public List<StockActualRowDto> StockActual { get; set; } = new();

        public List<StockCriticoRowDto> StockCritico { get; set; } = new();

        public List<InventarioValorizadoRowDto> Valorizacion { get; set; } = new();

        public List<KardexMovimientoDto> Kardex { get; set; } = new();

        public List<MovimientoResumenDto> ResumenMovimientos { get; set; } = new();

        public List<RotacionInventarioSimpleDto> Rotacion { get; set; } = new();

        public List<ProductoSinMovimientoInvDto> ProductosSinMovimiento { get; set; } = new();

        public List<ProductoDisponibilidadDto> DisponibilidadProductosClave { get; set; } = new();

        public List<CoberturaInventarioDto> Cobertura { get; set; } = new();
    }
}
