using ProfitManagerApp.Data.Rows;

namespace ProfitManagerApp.Data.Abstractions;

public interface IClienteRepository
{
  Task<bool> ExistsCodigoAsync(string codigo, CancellationToken ct);
  Task<ClienteRow> AddAsync(ClienteRow row, CancellationToken ct);
  Task<ClienteRow?> GetByIdAsync(int id, CancellationToken ct);
}
