using System.ComponentModel.DataAnnotations;

namespace ProfitManagerApp.Api.Dtos;

public record ClienteCreateDto(
    [Required, MaxLength(200)] string Nombre,
    [MaxLength(50)]  string? CodigoCliente,
    [MaxLength(20)]  string? TipoPersona,
    [MaxLength(50)]  string? Identificacion,
    [EmailAddress, MaxLength(200)] string? Correo,
    [MaxLength(50)]  string? Telefono,
    [MaxLength(300)] string? Direccion,
    bool? IsActive,
    [Range(0, 100)] decimal? DescuentoPorcentaje,
    string? DescuentoDescripcion
);

public record ClienteReadDto(
    int ClienteID,
    string? CodigoCliente,
    string Nombre,
    string TipoPersona,
    string? Identificacion,
    string? Correo,
    string? Telefono,
    string? Direccion,
    DateTime FechaRegistro,
    bool IsActive,
    DateTime CreatedAt,
    int? CreatedBy,
    DateTime? UpdatedAt,
    int? UpdatedBy,
    decimal DescuentoPorcentaje,
    string? DescuentoDescripcion
);

public record class ClienteUpdateDto
{
  [Required, MaxLength(200)] public string Nombre { get; init; } = null!;
  [MaxLength(50)] public string? CodigoCliente { get; init; }
  [MaxLength(20)] public string? TipoPersona { get; init; }  // "Natural"/"Jurídica" 
  [MaxLength(50)] public string? Identificacion { get; init; }
  [EmailAddress, MaxLength(200)] public string? Correo { get; init; }
  [MaxLength(50)] public string? Telefono { get; init; }
  [MaxLength(300)] public string? Direccion { get; init; }
  [Required] public bool IsActive { get; init; }
  [Range(0, 100)] public decimal? DescuentoPorcentaje { get; init; }
  public string? DescuentoDescripcion { get; init; }
}

public record class ClientePatchActivoDto
{
  [Required]
  public bool IsActive { get; init; }
}
