using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ProfitManagerApp.Api.Models.Rows;

namespace ProfitManagerApp.Api.Data.Abstractions
{
    public interface IProveedorRepository
    {
        Task<IEnumerable<ProveedorMiniRow>> GetActivosAsync(
            CancellationToken cancellationToken = default);
    }
}
