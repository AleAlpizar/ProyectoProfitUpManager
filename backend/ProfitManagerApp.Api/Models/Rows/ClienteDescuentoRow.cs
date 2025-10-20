namespace ProfitManagerApp.Api.Models.Rows
{
  public class ClienteDescuentoRow
  {
    public int ClienteDescuentoID { get; set; }
    public int ClienteID { get; set; }                 // FK

    public decimal? Porcentaje { get; set; }           // decimal(5,2) null
    public decimal? MontoFijo { get; set; }            // decimal(18,2) null

    public DateTime? FechaInicio { get; set; }         // datetime2 null
    public DateTime? FechaFin { get; set; }            // datetime2 null

    public string? Motivo { get; set; }                // nvarchar(250) null
    public bool IsActive { get; set; }                 // not null
  }
}
