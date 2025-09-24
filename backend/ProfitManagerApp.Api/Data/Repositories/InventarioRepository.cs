using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Data.Infrastructure;
using ProfitManagerApp.Domain.Inventory.Dto;

namespace ProfitManagerApp.Data.Repositories
{
    public class InventarioRepository : IInventarioRepository
    {
        private readonly SqlConnectionFactory _factory;
        public InventarioRepository(SqlConnectionFactory factory) => _factory = factory;

        public async Task<bool> PuedeAccederModuloAsync(int usuarioId, string modulo, string accion)
        {
            using var conn = _factory.Create(); 
            var res = await conn.QueryFirstOrDefaultAsync<bool>(
                "dbo.usp_Seguridad_PuedeAccederModulo",
                new { UsuarioID = usuarioId, NombreModulo = modulo, Accion = accion },
                commandType: CommandType.StoredProcedure);
            return res;
        }

        public async Task<int> CrearProductoAsync(ProductoCreateDto dto, int? createdBy)
        {
            using var conn = _factory.Create();
            try
            {
                var id = await conn.ExecuteScalarAsync<int>(
                    "dbo.usp_Producto_Create",
                    new
                    {
                        dto.SKU,
                        dto.Nombre,
                        dto.Descripcion,
                        dto.CodigoInterno,
                        dto.UnidadAlmacenamientoID,
                        dto.PrecioCosto,
                        dto.PrecioVenta,
                        dto.Peso,
                        dto.Largo,
                        dto.Alto,
                        dto.Ancho,

                        dto.BodegaId,
                        dto.StockInicial,

                        CreatedBy = createdBy
                    },
                    commandType: CommandType.StoredProcedure);

                return id;
            }
            catch (SqlException)
            {
                throw;
            }
        }

        public async Task<IEnumerable<StockRowDto>> GetStockAsync(int? productoId, int? bodegaId)
        {
            using var conn = _factory.Create();
            var rows = await conn.QueryAsync<StockRowDto>(
                "dbo.usp_Inventario_GetStock",
                new { ProductoID = productoId, BodegaID = bodegaId },
                commandType: CommandType.StoredProcedure);
            return rows;
        }

        public async Task AjusteAsync(AjusteInventarioDto dto, int? usuarioId)
        {
            using var conn = _factory.Create();
            await conn.ExecuteAsync(
                "dbo.usp_Inventario_Ajuste",
                new
                {
                    dto.ProductoID,
                    dto.BodegaID,
                    dto.TipoMovimiento,
                    dto.Cantidad,
                    dto.Motivo,
                    UsuarioID = usuarioId
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> BodegaExistsAsync(int bodegaId)
        {
            using var conn = _factory.Create();
            var exists = await conn.ExecuteScalarAsync<int?>(
                "SELECT 1 FROM dbo.Bodega WHERE BodegaID = @BodegaID AND IsActive = 1",
                new { BodegaID = bodegaId });
            return exists.HasValue;
        }

        public async Task<IEnumerable<BodegaDto>> GetBodegasAsync()
        {
            using var conn = _factory.Create();
            var sql = @"
                SELECT 
                    BodegaID   AS BodegaId,
                    Codigo,
                    Nombre,
                    IsActive
                FROM dbo.Bodega
                WHERE IsActive = 1
                ORDER BY Nombre;";
            return await conn.QueryAsync<BodegaDto>(sql);
        }
    }
}
