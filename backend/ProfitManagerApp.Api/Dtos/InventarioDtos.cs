using ProfitManagerApp.Domain.Inventory.Dto;

namespace ProfitManagerApp.Api.Dtos
{
  public sealed class DisponibilidadRequestDto
  {
    public List<int> ProductoIds { get; set; } = new();
  }

  public sealed record BodegaStockDto(int Id, string Nombre, decimal cantidad);

  public sealed record ProductoDisponibilidadDto(int Id, List<BodegaStockDto> Bodegas);
}
