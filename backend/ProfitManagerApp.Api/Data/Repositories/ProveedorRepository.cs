using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Dapper;
using ProfitManagerApp.Api.Data.Abstractions;
using ProfitManagerApp.Api.Dtos;
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

        public async Task<IEnumerable<ProveedorRow>> ListAsync(
            bool includeInactive = false,
            CancellationToken cancellationToken = default)
        {
            using var cn = _factory.Create();

            var cmd = new CommandDefinition(@"
                SELECT 
                    ProveedorID,
                    Nombre,
                    Contacto,
                    Telefono,
                    Correo,
                    Direccion,
                    IsActive
                FROM dbo.Proveedor
                WHERE (@IncludeInactive = 1 OR IsActive = 1)
                ORDER BY Nombre;
            ",
            new { IncludeInactive = includeInactive ? 1 : 0 },
            cancellationToken: cancellationToken);

            var rows = await cn.QueryAsync<ProveedorRow>(cmd);
            return rows;
        }

        public async Task<ProveedorRow?> GetByIdAsync(
            int proveedorId,
            CancellationToken cancellationToken = default)
        {
            using var cn = _factory.Create();

            var cmd = new CommandDefinition(@"
                SELECT 
                    ProveedorID,
                    Nombre,
                    Contacto,
                    Telefono,
                    Correo,
                    Direccion,
                    IsActive
                FROM dbo.Proveedor
                WHERE ProveedorID = @ProveedorID;
            ",
            new { ProveedorID = proveedorId },
            cancellationToken: cancellationToken);

            return await cn.QuerySingleOrDefaultAsync<ProveedorRow>(cmd);
        }

        public async Task<int> CreateAsync(
            ProveedorCreateInput input,
            CancellationToken cancellationToken = default)
        {
            using var cn = _factory.Create();

            var cmd = new CommandDefinition(@"
                INSERT INTO dbo.Proveedor
                    (Nombre, Contacto, Telefono, Correo, Direccion, IsActive)
                VALUES
                    (@Nombre, @Contacto, @Telefono, @Correo, @Direccion, 1);

                SELECT CAST(SCOPE_IDENTITY() AS int);
            ",
            new
            {
                input.Nombre,
                input.Contacto,
                input.Telefono,
                input.Correo,
                input.Direccion
            },
            cancellationToken: cancellationToken);

            var newId = await cn.ExecuteScalarAsync<int>(cmd);
            return newId;
        }

        public async Task<bool> UpdateAsync(
            int proveedorId,
            ProveedorUpdateInput input,
            CancellationToken cancellationToken = default)
        {
            using var cn = _factory.Create();

            var cmd = new CommandDefinition(@"
                UPDATE dbo.Proveedor
                SET
                    Nombre = @Nombre,
                    Contacto = @Contacto,
                    Telefono = @Telefono,
                    Correo = @Correo,
                    Direccion = @Direccion,
                    IsActive = COALESCE(@IsActive, IsActive)
                WHERE ProveedorID = @ProveedorID;
            ",
            new
            {
                ProveedorID = proveedorId,
                input.Nombre,
                input.Contacto,
                input.Telefono,
                input.Correo,
                input.Direccion,
                input.IsActive
            },
            cancellationToken: cancellationToken);

            var affected = await cn.ExecuteAsync(cmd);
            return affected > 0;
        }

        public async Task<bool> SetIsActiveAsync(
            int proveedorId,
            bool isActive,
            CancellationToken cancellationToken = default)
        {
            using var cn = _factory.Create();

            var cmd = new CommandDefinition(@"
                UPDATE dbo.Proveedor
                SET IsActive = @IsActive
                WHERE ProveedorID = @ProveedorID;
            ",
            new
            {
                ProveedorID = proveedorId,
                IsActive = isActive
            },
            cancellationToken: cancellationToken);

            var affected = await cn.ExecuteAsync(cmd);
            return affected > 0;
        }
    }
}