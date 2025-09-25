using System;
using System.Data;
using System.Threading.Tasks;
using System.Collections.Generic;
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
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure);

            return id;
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
        public async Task<IEnumerable<BodegaDto>> GetBodegasAsync()
        {
            using var conn = _factory.Create();
            var rows = await conn.QueryAsync<BodegaDto>(
                "dbo.usp_Bodega_List",
                commandType: CommandType.StoredProcedure);
            return rows;
        }
        public async Task<(string Server, string Database, int? ProcId)> DebugDbAsync()
        {
            using var conn = _factory.Create();
            var sql = @"
        SELECT
          @@SERVERNAME    AS ServerName,
          DB_NAME()       AS DbName,
          OBJECT_ID('dbo.usp_Bodega_List') AS ProcId;";
            var row = await conn.QuerySingleAsync<(string ServerName, string DbName, int? ProcId)>(sql);
            return (row.ServerName, row.DbName, row.ProcId);
        }

    }
}
