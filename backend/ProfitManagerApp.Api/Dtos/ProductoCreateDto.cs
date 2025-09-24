namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class ProductoCreateDto
    {
        public string? SKU { get; set; }
        public string Nombre { get; set; } = default!;
        public string? Descripcion { get; set; }
        public string? CodigoInterno { get; set; }
        public int? UnidadAlmacenamientoID { get; set; }
        public decimal? PrecioCosto { get; set; }
        public decimal PrecioVenta { get; set; }
        public decimal? Peso { get; set; }
        public decimal? Largo { get; set; }
        public decimal? Alto { get; set; }
        public decimal? Ancho { get; set; }

        public int BodegaId { get; set; }                
        public decimal? StockInicial { get; set; }       
    }
}
