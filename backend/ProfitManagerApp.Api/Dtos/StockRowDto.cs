namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class StockRowDto
    {
        public string Bodega { get; set; } = "";
        public string Producto { get; set; } = "";
        public string SKU { get; set; } = "";
        public decimal Existencia { get; set; }
        public decimal Disponible { get; set; }
    }
}
