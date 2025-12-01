using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Dapper;
using ProfitManagerApp.Api.Data.Abstractions;
using ProfitManagerApp.Api.Models.Rows;
using ProfitManagerApp.Data.Infrastructure;   

namespace ProfitManagerApp.Api.Repositories
{
    public class ProveedorRepository : IProveedorRepository
    {
        private readonly SqlConnectionFactory _factory;

        public ProveedorRepository(SqlConnectionFactory factory)
        {
            _factory = factory;
        }

        public async Task<IEnumerable<ProveedorMiniRow>> GetActivosAsync(
            CancellationToken cancellationToken = default)
        {
            using var cn = _factory.Create();

            var cmd = new CommandDefinition(@"
                SELECT 
                    ProveedorID,
                    Nombre,
                    Contacto,
                    Telefono,
                    Correo
                FROM dbo.Proveedor
                WHERE IsActive = 1
                ORDER BY Nombre;
            ", cancellationToken: cancellationToken);

            var rows = await cn.QueryAsync<ProveedorMiniRow>(cmd);
            return rows;
        }
    }
}
