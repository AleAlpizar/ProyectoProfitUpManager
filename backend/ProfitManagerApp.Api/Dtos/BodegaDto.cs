namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class BodegaDto
    {
        public int BodegaID { get; set; }
        public string? Codigo { get; set; }
        public string Nombre { get; set; } = default!;
        public string? Direccion { get; set; }
        public string? Contacto { get; set; }
        public bool IsActive { get; set; }
    }
}
