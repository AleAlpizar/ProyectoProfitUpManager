namespace ProfitManagerApp.Api.Models.Rows
{
    public class OrdenCompraItemRow
    {
        public int OrdenCompraItemID { get; set; }

        public int OrdenCompraID { get; set; }

        public int ProductoID { get; set; }

        public decimal Cantidad { get; set; }

        public decimal PrecioUnitario { get; set; }

        public OrdenCompraRow Orden { get; set; } = null!;
    }
}
