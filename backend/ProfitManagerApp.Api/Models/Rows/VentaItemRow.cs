namespace ProfitManagerApp.Api.Models.Rows
{
  public class VentaItemRow
  {
    public int VentaItemID { get; set; }
    public int VentaID { get; set; }

    public int? ProductoID { get; set; }
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public int BodegaID { get; set; } 
    public VentaRow? Venta { get; set; }
  }
}
