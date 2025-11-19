using System;

namespace ProfitManagerApp.Api.Rows
{
    public class ProductoRow
    {
        public int ProductoID { get; set; }

        public string Sku { get; set; } = string.Empty;

        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public bool IsActive { get; set; }

        public decimal PrecioVenta { get; set; }

        public decimal? PrecioCosto { get; set; }
        public decimal? Descuento { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
