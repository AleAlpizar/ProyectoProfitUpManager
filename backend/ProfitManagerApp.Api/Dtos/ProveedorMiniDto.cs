using System;

namespace ProfitManagerApp.Api.Dtos
{
    public sealed class ProveedorMiniDto
    {
        public int ProveedorID { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Contacto { get; set; }
        public string? Telefono { get; set; }
        public string? Correo { get; set; }
    }
}
