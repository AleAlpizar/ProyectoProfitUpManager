namespace ProfitManagerApp.Api.Dtos
{
    public class ProductoUpdateDto
    {
        public string Nombre { get; set; } = "";
        public string? Descripcion { get; set; }

        public decimal? Descuento { get; set; } = null;
    }
}


