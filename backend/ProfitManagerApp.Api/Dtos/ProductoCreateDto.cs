using System.ComponentModel.DataAnnotations;

namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class ProductoCreateDto
    {
        public string? SKU { get; set; }

        [Required] public string Nombre { get; set; } = default!;
        public string? Descripcion { get; set; }
        public string? CodigoInterno { get; set; }
        public int? UnidadAlmacenamientoID { get; set; }
        public decimal? PrecioCosto { get; set; }

        [Required, Range(0, double.MaxValue)]
        public decimal PrecioVenta { get; set; }

        public decimal? Peso { get; set; }
        public decimal? Largo { get; set; }
        public decimal? Alto { get; set; }
        public decimal? Ancho { get; set; }

        public int? BodegaID { get; set; }
        [Range(0, double.MaxValue)]
        public decimal? StockInicial { get; set; } = 0m;

        [Range(0, 100)]
        public decimal? Descuento { get; set; }

    }
}
