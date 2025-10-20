namespace ProfitManagerApp.Data.Rows;

public class ClienteRow
{
  public int ClienteID { get; set; }
  public string? CodigoCliente { get; set; }
  public string Nombre { get; set; } = null!;
  public string TipoPersona { get; set; } = "Natural";
  public string? Identificacion { get; set; }
  public string? Correo { get; set; }
  public string? Telefono { get; set; }
  public string? Direccion { get; set; }
  public DateTime FechaRegistro { get; set; }
  public bool IsActive { get; set; } = true;
  public DateTime CreatedAt { get; set; }
  public int? CreatedBy { get; set; }
  public DateTime? UpdatedAt { get; set; }
  public int? UpdatedBy { get; set; }
  public decimal DescuentoPorcentaje { get; set; }
  public string DescuentoDescripcion { get; set; } = "";
}
