namespace ProfitManagerApp.Api.Models.Rows
{
  public class ProductoRow
  {
    public int ProductoID { get; set; }
    public string Sku { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public decimal PrecioUnitario { get; set; }
    public decimal? ImpuestoPorcentaje { get; set; }
  }
}
