using ProfitManagerApp.Data.Rows;

namespace ProfitManagerApp.Data.Abstractions;

public interface IClienteRepository
{
  Task<bool> ExistsCodigoAsync(string codigo, CancellationToken ct);
  Task<bool> ExistsCodigoForOtherAsync(int id, string codigo, CancellationToken ct);
  Task<ClienteRow> AddAsync(ClienteRow row, CancellationToken ct);
  Task<ClienteRow?> GetByIdAsync(int id, CancellationToken ct);
  Task<List<ClienteRow>> GetAll(CancellationToken ct);
  Task<bool> SetActivoAsync(int id, bool isActive, int? updatedBy, DateTime whenUtc, CancellationToken ct);
  Task<bool> UpdateAsync(
        int id,
        string nombre, string? codigoCliente, string? tipoPersona,
        string? identificacion, string? correo, string? telefono, string? direccion,
        bool isActive, decimal descuentoPorcentaje, string? descuentoDescripcion, int? updatedBy, DateTime whenUtc, CancellationToken ct);

}
