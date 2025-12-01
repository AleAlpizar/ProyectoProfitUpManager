using System;

namespace ProfitManagerApp.Api.Dtos
{
    public sealed class ProveedorDto
    {
        public int ProveedorID { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Contacto { get; set; }
        public string? Telefono { get; set; }
        public string? Correo { get; set; }
        public string? Direccion { get; set; }
        public bool IsActive { get; set; }
    }

    public sealed class ProveedorCreateInput
    {
        public string Nombre { get; set; } = null!;
        public string? Contacto { get; set; }
        public string? Telefono { get; set; }
        public string? Correo { get; set; }
        public string? Direccion { get; set; }
    }

    public sealed class ProveedorUpdateInput
    {
        public string? Nombre { get; set; }
        public string? Contacto { get; set; }
        public string? Telefono { get; set; }
        public string? Correo { get; set; }
        public string? Direccion { get; set; }
        public bool? IsActive { get; set; }
    }
}
