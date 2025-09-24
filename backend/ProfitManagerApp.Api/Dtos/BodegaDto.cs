namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class BodegaDto
    {
        public int BodegaId { get; set; }      
        public string? Codigo { get; set; }   
        public string Nombre { get; set; } = null!;
        public bool IsActive { get; set; }
    }
}
