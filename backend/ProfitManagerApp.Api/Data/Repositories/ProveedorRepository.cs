using System.Collections.Generic;
using System.Linq;
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

            var sets = new List<string>();

            if (input.Nombre != null) sets.Add("Nombre = @Nombre");
            if (input.Contacto != null) sets.Add("Contacto = @Contacto");
            if (input.Telefono != null) sets.Add("Telefono = @Telefono");
            if (input.Correo != null) sets.Add("Correo = @Correo");
            if (input.Direccion != null) sets.Add("Direccion = @Direccion");
            if (input.IsActive.HasValue) sets.Add("IsActive = @IsActive");

            if (sets.Count == 0)
            {
                // Nada que actualizar
                return false;
            }

            var sql = $@"
                UPDATE dbo.Proveedor
                SET {string.Join(", ", sets)}
                WHERE ProveedorID = @ProveedorID;
            ";

            var cmd = new CommandDefinition(sql,
                new
                {
                    ProveedorID = proveedorId,
                    input.Nombre,
                    input.Contacto,
                    input.Telefono,
                    input.Correo,
                    input.Direccion,
                    IsActive = input.IsActive
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
