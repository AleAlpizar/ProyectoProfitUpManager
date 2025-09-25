namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class StockRowDto
    {
        public int BodegaID { get; set; }
        public string Bodega { get; set; } = default!;
        public int ProductoID { get; set; }
        public string Producto { get; set; } = default!;
        public string? SKU { get; set; }
        public decimal Existencia { get; set; }
        public decimal Disponible { get; set; }
    }
}
