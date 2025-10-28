using System.ComponentModel.DataAnnotations;

namespace ProfitManagerApp.Api.Dtos
{
  public sealed class VentaFromUiDto
  {
    [Required] public string ClienteCodigo { get; set; } = default!;
    public DateTime? Fecha { get; set; }
    public string? Observaciones { get; set; }
    [Required, MinLength(1)] public List<VentaLineaFromUiDto> Lineas { get; set; } = new();
  }

  public sealed class VentaLineaFromUiDto
  {
    [Required] public string Sku { get; set; } = default!;
    [Range(0.01, 9999999999999.99)] public decimal Cantidad { get; set; } = 1;
    [Range(0, 100)] public decimal? Descuento { get; set; } 
    public BodegaPickDto? Bodega { get; set; }              
  }

  public sealed class BodegaPickDto
  {
    public string? Id { get; set; } 
  }
}
