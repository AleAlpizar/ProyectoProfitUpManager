namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class ProductoMiniDto
    {
        public int ProductoID { get; set; }
        public string? SKU { get; set; }
        public string Nombre { get; set; } = "";
        public string Descripcion { get; set; } = "";
        public decimal? Descuento { get; set; }
        public decimal? PrecioVenta { get; set; }
  }
}
