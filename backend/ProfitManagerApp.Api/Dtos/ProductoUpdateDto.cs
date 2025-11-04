namespace ProfitManagerApp.Api.Dtos
{
    public class ProductoUpdateDto
    {
        public string Nombre { get; set; } = "";               
        public string? Descripcion { get; set; }
        public string? SKU { get; set; }
        public string? CodigoInterno { get; set; }
        public int? UnidadAlmacenamientoID { get; set; }
        public decimal? PrecioCosto { get; set; }
        public decimal? PrecioVenta { get; set; }            
        public decimal? Peso { get; set; }
        public decimal? Largo { get; set; }
        public decimal? Alto { get; set; }
        public decimal? Ancho { get; set; }
        public decimal? Descuento { get; set; }                
    }
}
