using System.ComponentModel.DataAnnotations;

namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class BodegaCreateDto
    {
        public string? Codigo { get; set; }

        [Required] public string Nombre { get; set; } = default!;

        public string? Direccion { get; set; }
        public string? Contacto { get; set; }
    }
}
