using ProfitManagerApp.Api.Enums;
using System.ComponentModel.DataAnnotations;

namespace ProfitManagerApp.Api.Dtos
{
    public sealed class VentaFromUiDto
    {
        [Required(ErrorMessage = "El código del cliente es obligatorio.")]
        [MinLength(1, ErrorMessage = "El código del cliente es obligatorio.")]
        public string ClienteCodigo { get; set; } = default!;

        public DateTime? Fecha { get; set; }
        public string? Observaciones { get; set; }

        [Required(ErrorMessage = "Debes agregar al menos una línea.")]
        [MinLength(1, ErrorMessage = "Debes agregar al menos una línea.")]
        public List<VentaLineaFromUiDto> Lineas { get; set; } = new();
    }

    public sealed class VentaLineaFromUiDto
    {
        [Required(ErrorMessage = "El SKU es obligatorio.")]
        public string Sku { get; set; } = default!;

        [Range(typeof(decimal), "0.01", "9999999999999.99", ErrorMessage = "La cantidad debe ser mayor que cero.")]
        public decimal Cantidad { get; set; } = 1;

        [Range(typeof(decimal), "0", "100", ErrorMessage = "El descuento debe estar entre 0 y 100.")]
        public decimal? Descuento { get; set; }

        [Required(ErrorMessage = "La bodega es obligatoria.")]
        public BodegaPickDto? Bodega { get; set; }
    }

    public sealed class BodegaPickDto
    {
        public string? Id { get; set; }
    }

    public sealed class VentaDetalleDto
    {
        public int? ProductoID { get; set; }
        public string Sku { get; set; } = "";
        public string Descripcion { get; set; } = "—";
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal DescuentoLineaPorcentaje { get; set; } = 0;
        public decimal Importe { get; set; }
        public int? BodegaID { get; set; }
    }

    public sealed class VentaGetDto
    {
        public int VentaID { get; set; }
        public int? ClienteID { get; set; }
        public string ClienteCodigo { get; set; } = string.Empty;
        public string ClienteNombre { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Descuento { get; set; }
        public decimal Total { get; set; }
        public List<VentaDetalleDto> Detalles { get; set; } = new();
        public EstadoVentaEnum Estado { get; set; }
    }

    public sealed class VentaHistorialFilterDto
    {
        public DateTime? FechaDesde { get; set; }
        public DateTime? FechaHasta { get; set; }
        public int? ClienteID { get; set; }
        public string? ClienteCodigo { get; set; }
        public EstadoVentaEnum? Estado { get; set; }
        public decimal? TotalMin { get; set; }
        public decimal? TotalMax { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public sealed class VentaHistorialListItemDto
    {
        public int VentaID { get; set; }
        public DateTime Fecha { get; set; }
        public int? ClienteID { get; set; }
        public string ClienteNombre { get; set; } = string.Empty;
        public string ClienteCodigo { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
        public decimal Descuento { get; set; }
        public decimal Total { get; set; }
        public EstadoVentaEnum Estado { get; set; }
    }

    public sealed class VentaHistorialPageDto
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public List<VentaHistorialListItemDto> Items { get; set; } = new();
    }
}