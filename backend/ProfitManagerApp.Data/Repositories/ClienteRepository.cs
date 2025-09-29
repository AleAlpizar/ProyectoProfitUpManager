using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Data.Rows;

namespace ProfitManagerApp.Data.Repositories;

public class ClienteRepository(AppDbContext db) : IClienteRepository
{
  public Task<bool> ExistsCodigoAsync(string codigo, CancellationToken ct) =>
      db.Clientes.AsNoTracking().AnyAsync(x => x.CodigoCliente == codigo, ct);

  public async Task<ClienteRow> AddAsync(ClienteRow row, CancellationToken ct)
  {
    db.Clientes.Add(row);
    await db.SaveChangesAsync(ct);
    return row;
  }

  public Task<ClienteRow?> GetByIdAsync(int id, CancellationToken ct) =>
      db.Clientes.AsNoTracking().FirstOrDefaultAsync(x => x.ClienteID == id, ct);
}
