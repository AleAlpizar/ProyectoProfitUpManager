using System.ComponentModel.DataAnnotations;
using ProfitManagerApp.Api.Enums;

namespace ProfitManagerApp.Api.Dtos
{
    public sealed class OrdenCompraFromUiDto
    {
        [Required]
        public int ProveedorID { get; set; }

        public DateTime? FechaSolicitud { get; set; }
        public DateTime? FechaEstimada { get; set; }

        public string? Observaciones { get; set; } 

        [Required, MinLength(1)]
        public List<OrdenCompraLineaFromUiDto> Lineas { get; set; } = new();
    }

    public sealed class OrdenCompraLineaFromUiDto
    {
        [Required]
        public string Sku { get; set; } = default!;

        [Range(0.01, 9999999999999.99)]
        public decimal Cantidad { get; set; } = 1;

        [Range(0.01, 9999999999999.99)]
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
        public DateTime? FechaDesde { get; set; }
        public DateTime? FechaHasta { get; set; }

        public int? ProveedorID { get; set; }

        public string? ProveedorNombre { get; set; }

        public EstadoOrdenCompraEnum? Estado { get; set; }

        public decimal? TotalMin { get; set; }
        public decimal? TotalMax { get; set; }

        public int Page { get; set; } = 1;
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
