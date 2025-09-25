namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class BodegaDto
    {
        public int BodegaId { get; set; }
        public string? Codigo { get; set; }
        public string Nombre { get; set; } = default!;
        public bool IsActive { get; set; }
    }
}
