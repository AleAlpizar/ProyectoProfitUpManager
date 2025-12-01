using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Models.Rows;

namespace ProfitManagerApp.Api.Data.Abstractions
{
    public interface IProveedorRepository
    {
        Task<IEnumerable<ProveedorMiniRow>> GetActivosAsync(
            CancellationToken cancellationToken = default);

        Task<IEnumerable<ProveedorRow>> ListAsync(
            bool includeInactive = false,
            CancellationToken cancellationToken = default);

        Task<ProveedorRow?> GetByIdAsync(
            int proveedorId,
            CancellationToken cancellationToken = default);

        Task<int> CreateAsync(
            ProveedorCreateInput input,
            CancellationToken cancellationToken = default);

        Task<bool> UpdateAsync(
            int proveedorId,
            ProveedorUpdateInput input,
            CancellationToken cancellationToken = default);

        Task<bool> SetIsActiveAsync(
            int proveedorId,
            bool isActive,
            CancellationToken cancellationToken = default);
    }
}
