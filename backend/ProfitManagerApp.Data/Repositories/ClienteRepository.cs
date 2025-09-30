using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Data.Rows;

namespace ProfitManagerApp.Data.Repositories;

public class ClienteRepository(AppDbContext db) : IClienteRepository
{
  public Task<bool> ExistsCodigoAsync(string codigo, CancellationToken ct) =>
      db.Clientes.AsNoTracking().AnyAsync(x => x.CodigoCliente == codigo, ct);

  public Task<bool> ExistsCodigoForOtherAsync(int id, string codigo, CancellationToken ct) =>
       db.Clientes.AsNoTracking().AnyAsync(x => x.ClienteID != id && x.CodigoCliente == codigo, ct);

  public async Task<ClienteRow> AddAsync(ClienteRow row, CancellationToken ct)
  {
    db.Clientes.Add(row);
    await db.SaveChangesAsync(ct);
    return row;
  }

  public Task<ClienteRow?> GetByIdAsync(int id, CancellationToken ct) =>
      db.Clientes.AsNoTracking().FirstOrDefaultAsync(x => x.ClienteID == id, ct);

  public Task<List<ClienteRow>> GetAll(CancellationToken ct)
  {
    return db.Clientes.ToListAsync(cancellationToken: ct);
  }
  public async Task<bool> SetActivoAsync(int id, bool isActive, int? updatedBy, DateTime whenUtc, CancellationToken ct)
  {
    var affected = await db.Clientes
        .Where(x => x.ClienteID == id)
        .ExecuteUpdateAsync(setters => setters
            .SetProperty(x => x.IsActive, isActive)
            .SetProperty(x => x.UpdatedAt, whenUtc)
            .SetProperty(x => x.UpdatedBy, updatedBy), ct);

    return affected > 0;
  }
  public async Task<bool> UpdateAsync(
        int id,
        string nombre, string? codigoCliente, string? tipoPersona,
        string? identificacion, string? correo, string? telefono, string? direccion,
        bool isActive, int? updatedBy, DateTime whenUtc, CancellationToken ct)
  {
    var affected = await db.Clientes
        .Where(x => x.ClienteID == id)
        .ExecuteUpdateAsync(s => s
            .SetProperty(x => x.Nombre, nombre)
            .SetProperty(x => x.CodigoCliente, codigoCliente)
            .SetProperty(x => x.TipoPersona, tipoPersona)
            .SetProperty(x => x.Identificacion, identificacion)
            .SetProperty(x => x.Correo, correo)
            .SetProperty(x => x.Telefono, telefono)
            .SetProperty(x => x.Direccion, direccion)
            .SetProperty(x => x.IsActive, isActive)
            .SetProperty(x => x.UpdatedAt, whenUtc)
            .SetProperty(x => x.UpdatedBy, updatedBy), ct);
    return affected > 0;
  }
}

