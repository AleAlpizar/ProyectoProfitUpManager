namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class InventarioSetCantidadDto
    {
        public int ProductoID { get; set; }
        public int BodegaID { get; set; }
        public decimal NuevaCantidad { get; set; }
        public string? Motivo { get; set; }
    }

    public class AsignacionCreateDto
    {
        public int ProductoID { get; set; }
        public int BodegaID { get; set; }
    }
}
