namespace ProfitManagerApp.Api.Models.Rows
{
  public class UnidadAlmacenamientoRow
  {
    public int UnidadID { get; set; }
    public string Codigo { get; set; } = default!;
    public string Nombre { get; set; } = default!;
    public bool Activo { get; set; }
  }
}
