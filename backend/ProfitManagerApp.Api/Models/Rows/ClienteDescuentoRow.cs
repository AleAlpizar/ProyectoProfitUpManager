namespace ProfitManagerApp.Api.Models.Rows
{
  public class ClienteDescuentoRow
  {
    public int ClienteDescuentoID { get; set; }
    public int ClienteID { get; set; }              

    public decimal? Porcentaje { get; set; }          
    public decimal? MontoFijo { get; set; }            

    public DateTime? FechaInicio { get; set; }        
    public DateTime? FechaFin { get; set; }           

    public string? Motivo { get; set; }                
    public bool IsActive { get; set; }                
  }
}
