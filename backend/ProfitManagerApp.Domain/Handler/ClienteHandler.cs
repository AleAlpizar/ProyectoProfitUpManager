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
    UpdatedBy = r.UpdatedBy,
    DescuentoDescripcion = r.DescuentoDescripcion,
    DescuentoPorcentaje = r.DescuentoPorcentaje
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

  public async Task<ClienteModel?> ActualizarAsync(
        int id,
        string nombre, string? codigoCliente, string? tipoPersona,
        string? identificacion, string? correo, string? telefono, string? direccion,
        bool isActive, decimal descuentoPorcentaje, string descuentoDescripcion, ClaimsPrincipal? user, CancellationToken ct)
  {

    // ver que el codigo nos se repita
    if (!string.IsNullOrWhiteSpace(codigoCliente))
    {
      var exists = await repo.ExistsCodigoForOtherAsync(id, codigoCliente!, ct);
      if (exists) throw new InvalidOperationException("CodigoCliente ya existe en otro cliente.");
    }

    nombre = nombre.Trim();
    codigoCliente = TrimOrNull(codigoCliente);
    tipoPersona = TrimOrNull(tipoPersona) ?? "Natural";
    identificacion = TrimOrNull(identificacion);
    correo = TrimOrNull(correo);
    telefono = TrimOrNull(telefono);
    direccion = TrimOrNull(direccion);

    int? updatedBy = null;
    var sub = user?.FindFirst("sub")?.Value ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (int.TryParse(sub, out var uid)) updatedBy = uid;

    var whenUtc = DateTime.UtcNow;

    var ok = await repo.UpdateAsync(id, nombre, codigoCliente, tipoPersona,
        identificacion, correo, telefono, direccion, isActive, descuentoPorcentaje, descuentoDescripcion, updatedBy, whenUtc, ct);
    if (!ok) return null;

    var row = await repo.GetByIdAsync(id, ct);
    return row is null ? null : ToModel(row);

    //return row is null ? null : new ClienteModel
    //{
    //  ClienteID = row.ClienteID,
    //  CodigoCliente = row.CodigoCliente,
    //  Nombre = row.Nombre,
    //  TipoPersona = row.TipoPersona,
    //  Identificacion = row.Identificacion,
    //  Correo = row.Correo,
    //  Telefono = row.Telefono,
    //  Direccion = row.Direccion,
    //  FechaRegistro = row.FechaRegistro,
    //  IsActive = row.IsActive,
    //  CreatedAt = row.CreatedAt,
    //  CreatedBy = row.CreatedBy,
    //  UpdatedAt = row.UpdatedAt,
    //  UpdatedBy = row.UpdatedBy
    //};
  }

  private static string? TrimOrNull(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}

