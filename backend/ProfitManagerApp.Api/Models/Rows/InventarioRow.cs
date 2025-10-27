namespace ProfitManagerApp.Api.Models.Rows
{
  public class InventarioRow
  {
    public int InventarioID { get; set; }
    public int ProductoID { get; set; }
    public int BodegaID { get; set; }
    public decimal Cantidad { get; set; }
  }
}
