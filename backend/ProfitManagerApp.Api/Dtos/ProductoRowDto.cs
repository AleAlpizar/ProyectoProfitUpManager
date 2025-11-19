using System;

namespace ProfitManagerApp.Api.Dtos
{
    public class ProductoRowDto
    {
        public int ProductoID { get; set; }
        public string SKU { get; set; } = "";
        public string Nombre { get; set; } = "";
        public string Descripcion { get; set; } = "";
        public decimal? Descuento { get; set; }
        public decimal PrecioVenta { get; set; }
        public bool IsActive { get; set; }

        public decimal? PrecioCosto { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
