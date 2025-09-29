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
    bool? IsActive
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
    int? UpdatedBy
);

public record ClienteUpdateDto(
    [property: Required, MaxLength(200)] string Nombre,
    [property: MaxLength(50)] string? CodigoCliente,
    [property: MaxLength(20)] string? TipoPersona,
    [property: MaxLength(50)] string? Identificacion,
    [property: EmailAddress, MaxLength(200)] string? Correo,
    [property: MaxLength(50)] string? Telefono,
    [property: MaxLength(300)] string? Direccion,
    [property: Required] bool IsActive
);

public class ClientePatchDto // vamos a usar patch?
{
  [MaxLength(200)] public string? Nombre { get; set; }
  [MaxLength(50)] public string? CodigoCliente { get; set; }
  [MaxLength(20)] public string? TipoPersona { get; set; }
  [MaxLength(50)] public string? Identificacion { get; set; }
  [EmailAddress, MaxLength(200)] public string? Correo { get; set; }
  [MaxLength(50)] public string? Telefono { get; set; }
  [MaxLength(300)] public string? Direccion { get; set; }
  public bool? IsActive { get; set; }
}
