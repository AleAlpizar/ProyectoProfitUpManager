namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class StockRowDto
    {
        public int InventarioID { get; set; }
        public int ProductoID { get; set; }
        public string Producto { get; set; } = default!;
        public string? SKU { get; set; }
        public int BodegaID { get; set; }
        public string Bodega { get; set; } = default!;
        public decimal Cantidad { get; set; }
        public decimal CantidadReservada { get; set; }
        public decimal Disponible { get; set; }
        public DateTime FechaUltimaActualizacion { get; set; }
    }
}
