using System.ComponentModel.DataAnnotations;
using ProfitManagerApp.Api.Enums;

namespace ProfitManagerApp.Api.Dtos
{
    public sealed class OrdenCompraFromUiDto
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "El proveedor es requerido.")]
        public int ProveedorID { get; set; }

        public DateTime? FechaSolicitud { get; set; }
        public DateTime? FechaEstimada { get; set; }

        [StringLength(500, ErrorMessage = "Las observaciones no pueden superar los 500 caracteres.")]
        public string? Observaciones { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Debe incluir al menos una línea de detalle.")]
        public List<OrdenCompraLineaFromUiDto> Lineas { get; set; } = new();
    }

    public sealed class OrdenCompraLineaFromUiDto
    {
        [Required(ErrorMessage = "El SKU es requerido.")]
        [StringLength(100, ErrorMessage = "El SKU no puede superar los 100 caracteres.")]
        public string Sku { get; set; } = default!;

        [Range(0.01, 9999999999999.99, ErrorMessage = "La cantidad debe ser mayor a 0.")]
        public decimal Cantidad { get; set; } = 1;

        [Range(0.01, 9999999999999.99, ErrorMessage = "El precio unitario debe ser mayor a 0.")]
        public decimal? PrecioUnitario { get; set; }
    }

    public sealed class OrdenCompraDetalleDto
    {
        public int? ProductoID { get; set; }
        public string Sku { get; set; } = "";
        public string Descripcion { get; set; } = "—";
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Importe { get; set; }
    }

    public sealed class OrdenCompraGetDto
    {
        public int OrdenCompraID { get; set; }

        public string? CodigoOrden { get; set; }

        public int ProveedorID { get; set; }

        public string ProveedorNombre { get; set; } = string.Empty;

        public DateTime FechaSolicitud { get; set; }
        public DateTime? FechaEstimada { get; set; }

        public decimal Total { get; set; }

        public string? Observaciones { get; set; }

        public EstadoOrdenCompraEnum Estado { get; set; }

        public List<OrdenCompraDetalleDto> Detalles { get; set; } = new();
    }

    public sealed class OrdenCompraHistorialFilterDto
    {
        public int? OrdenCompraID { get; set; }

        public DateTime? FechaDesde { get; set; }
        public DateTime? FechaHasta { get; set; }

        public int? ProveedorID { get; set; }

        public string? ProveedorNombre { get; set; }

        public EstadoOrdenCompraEnum? Estado { get; set; }

        public decimal? TotalMin { get; set; }
        public decimal? TotalMax { get; set; }

        [Range(1, int.MaxValue)]
        public int Page { get; set; } = 1;

        [Range(1, 100)]
        public int PageSize { get; set; } = 20;
    }

    public sealed class OrdenCompraHistorialListItemDto
    {
        public int OrdenCompraID { get; set; }
        public DateTime FechaSolicitud { get; set; }

        public int ProveedorID { get; set; }
        public string ProveedorNombre { get; set; } = string.Empty;

        public decimal Total { get; set; }

        public EstadoOrdenCompraEnum Estado { get; set; }
    }

    public sealed class OrdenCompraHistorialPageDto
    {
        public int Page { get; set; }
        public int PageSize { get; set; }

        public int TotalItems { get; set; }
        public int TotalPages { get; set; }

        public List<OrdenCompraHistorialListItemDto> Items { get; set; } = new();
    }
}