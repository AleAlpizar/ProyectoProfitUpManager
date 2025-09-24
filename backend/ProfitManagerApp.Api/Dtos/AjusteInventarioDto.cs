namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class AjusteInventarioDto
    {
        public int ProductoID { get; set; }
        public int BodegaID { get; set; }
        public string TipoMovimiento { get; set; } = default!; 
        public decimal Cantidad { get; set; }
        public string? Motivo { get; set; }
    }
}
