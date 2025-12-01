namespace ProfitManagerApp.Api.Models.Rows
{
    public class ProveedorMiniRow
    {
        public int ProveedorID { get; set; }
        public string Nombre { get; set; } = default!;
        public string? Contacto { get; set; }
        public string? Telefono { get; set; }
        public string? Correo { get; set; }
    }
}
