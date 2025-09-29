using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Data.Rows;
using ProfitManagerApp.Domain.Models;
using System.Security.Claims;

namespace ProfitManagerApp.Application.Clientes;

public class ClienteHandler(IClienteRepository repo)
{
  // Mapeos privados Row <-> Model
  private static ClienteModel ToModel(ClienteRow r) => new()
  {
    ClienteID = r.ClienteID,
    CodigoCliente = r.CodigoCliente,
    Nombre = r.Nombre,
    TipoPersona = r.TipoPersona,
    Identificacion = r.Identificacion,
    Correo = r.Correo,
    Telefono = r.Telefono,
    Direccion = r.Direccion,
    FechaRegistro = r.FechaRegistro,
    IsActive = r.IsActive,
    CreatedAt = r.CreatedAt,
    CreatedBy = r.CreatedBy,
    UpdatedAt = r.UpdatedAt,
    UpdatedBy = r.UpdatedBy
  };

  private static ClienteRow ToRowForCreate(
      string nombre, string? codigo, string? tipoPersona, string? identificacion,
      string? correo, string? telefono, string? direccion, bool? isActive, int? createdBy)
  {
    return new ClienteRow
    {
      Nombre = nombre.Trim(),
      CodigoCliente = string.IsNullOrWhiteSpace(codigo) ? null : codigo.Trim(),
      TipoPersona = string.IsNullOrWhiteSpace(tipoPersona) ? "Natural" : tipoPersona.Trim(),
      Identificacion = string.IsNullOrWhiteSpace(identificacion) ? null : identificacion.Trim(),
      Correo = string.IsNullOrWhiteSpace(correo) ? null : correo.Trim(),
      Telefono = string.IsNullOrWhiteSpace(telefono) ? null : telefono.Trim(),
      Direccion = string.IsNullOrWhiteSpace(direccion) ? null : direccion.Trim(),
      IsActive = isActive ?? true
      // FechaRegistro/CreatedAt los pone la BD
    };
  }

  public async Task<bool> CodigoExisteAsync(string codigo, CancellationToken ct)
      => await repo.ExistsCodigoAsync(codigo, ct);

  // Caso de uso: crear cliente y devolver Modelo de dominio
  public async Task<ClienteModel> CrearAsync(
      string nombre, string? codigoCliente, string? tipoPersona, string? identificacion,
      string? correo, string? telefono, string? direccion, bool? isActive,
      ClaimsPrincipal? user, CancellationToken ct)
  {
    int? createdBy = null;
    var sub = user?.FindFirst("sub")?.Value ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (int.TryParse(sub, out var uid)) createdBy = uid;

    var row = ToRowForCreate(nombre, codigoCliente, tipoPersona, identificacion, correo, telefono, direccion, isActive, createdBy);
    row.CreatedBy = createdBy;

    var added = await repo.AddAsync(row, ct);
    return ToModel(added);
  }

  public async Task<List<ClienteModel>> ObtenerClientes(CancellationToken ct)
  {
    var result = await repo.GetAll(ct);
    var mappedResult = new List<ClienteModel>();
    result.ForEach(r => mappedResult.Add(ToModel(r)));
    return mappedResult;
  }

  public async Task<ClienteModel?> ObtenerPorIdAsync(int id, CancellationToken ct)
  {
    var row = await repo.GetByIdAsync(id, ct);
    return row is null ? null : ToModel(row);
  }
  public async Task<ClienteModel?> SetActivoAsync(int id, bool isActive, ClaimsPrincipal? user, CancellationToken ct)
  {
    int? updatedBy = null;
    var sub = user?.FindFirst("sub")?.Value ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (int.TryParse(sub, out var uid)) updatedBy = uid;

    var whenUtc = DateTime.UtcNow;

    var ok = await repo.SetActivoAsync(id, isActive, updatedBy, whenUtc, ct);
    if (!ok) return null;

    var row = await repo.GetByIdAsync(id, ct);
    return row is null ? null : ToModel(row);
  }
}

