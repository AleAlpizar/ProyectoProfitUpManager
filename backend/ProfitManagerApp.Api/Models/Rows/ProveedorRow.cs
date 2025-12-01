namespace ProfitManagerApp.Api.Models.Rows
{
    public class ProveedorRow
    {
        public int ProveedorID { get; set; }

        public string Nombre { get; set; } = null!;

        public string? Contacto { get; set; }

        public string? Telefono { get; set; }

        public string? Correo { get; set; }

        public string? Direccion { get; set; }

        public bool IsActive { get; set; }
    }
}
