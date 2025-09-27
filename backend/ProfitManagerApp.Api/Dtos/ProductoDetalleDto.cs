namespace ProfitManagerApp.Api.Dtos
{
    public class ProductoDetalleDto
    {
        public string? CodigoInterno { get; set; }
        public decimal? Peso { get; set; }
        public decimal? Largo { get; set; }
        public decimal? Alto { get; set; }
        public decimal? Ancho { get; set; }
        public int? UnidadAlmacenamientoID { get; set; }
        public decimal? PrecioCosto { get; set; }
        public decimal? PrecioVenta { get; set; }
    }
}
