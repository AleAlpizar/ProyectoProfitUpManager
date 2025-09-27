using System;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Dapper;
using Microsoft.Data.SqlClient;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Data.Infrastructure;
using ProfitManagerApp.Domain.Inventory.Dto;
using ProfitManagerApp.Api.Dtos;

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
                    BodegaID = dto.BodegaID,   
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


        public async Task<IEnumerable<UnidadDto>> GetUnidadesAsync()
        {
            using var conn = _factory.Create();

            try
            {
                var rows = await conn.QueryAsync<UnidadDto>(
                    "dbo.usp_Unidad_List",
                    commandType: CommandType.StoredProcedure);

                Console.WriteLine($"[Unidades] OK SP en DB='{conn.Database}'");
                return rows;
            }
            catch (SqlException ex) when (ex.Number == 2812) 
            {
                Console.WriteLine($"[Unidades] SP NO existe en DB='{conn.Database}'. Fallback a SELECT. Detalle: {ex.Message}");
            }
            catch (SqlException ex) when (ex.Number == 208) 
            {
                Console.WriteLine($"[Unidades] Error obj. no existe en DB='{conn.Database}'. Fallback a SELECT. Detalle: {ex.Message}");
            }

            var columnas = (await conn.QueryAsync<string>(
                @"SELECT name 
                    FROM sys.columns 
                   WHERE object_id = OBJECT_ID('dbo.UnidadAlmacenamiento');"))
                   .ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (columnas.Count == 0)
                throw new InvalidOperationException(
                    $"[Unidades] No existe la tabla dbo.UnidadAlmacenamiento en DB='{conn.Database}'. Revisa la connection string.");

            bool hasCodigo = columnas.Contains("Codigo");
            bool hasNombre = columnas.Contains("Nombre");
            bool hasActivo = columnas.Contains("Activo");

            string sql =
                $@"SELECT 
                      UnidadID,
                      {(hasCodigo ? "Codigo" : "CAST(NULL AS NVARCHAR(50)) AS Codigo")},
                      {(hasNombre ? "Nombre" : "CAST(NULL AS NVARCHAR(100)) AS Nombre")},
                      {(hasActivo ? "Activo" : "CAST(1 AS bit) AS Activo")}
                  FROM dbo.UnidadAlmacenamiento
                  {(hasActivo ? "WHERE Activo = 1" : "")}
                  ORDER BY {(hasNombre ? "Nombre" : "UnidadID")};";

            Console.WriteLine($"[Unidades] SELECT dinámico en DB='{conn.Database}'. hasCodigo={hasCodigo}, hasNombre={hasNombre}, hasActivo={hasActivo}");

            var dynRows = await conn.QueryAsync<UnidadDto>(sql, commandType: CommandType.Text);
            return dynRows;
        }

        public async Task<(string Server, string Database, int? ProcId)> DebugUnidadesAsync()
        {
            using var conn = _factory.Create();
            var row = await conn.QuerySingleAsync<(string, string, int?)>(
                "SELECT @@SERVERNAME, DB_NAME(), OBJECT_ID('dbo.usp_Unidad_List');",
                commandType: CommandType.Text);

            return (row.Item1, row.Item2, row.Item3);
        }
        public async Task<IEnumerable<ProductoMiniDto>> GetProductosMiniAsync()
        {
            using var conn = _factory.Create();
            var rows = await conn.QueryAsync<ProductoMiniDto>(
                "dbo.usp_Producto_MiniList",
                commandType: CommandType.StoredProcedure);
            return rows;
        }

        public async Task<IEnumerable<ProductoRowDto>> GetProductosAsync()
        {
            using var conn = _factory.Create();
            var rows = await conn.QueryAsync<ProductoRowDto>(
                "SELECT ProductoID, SKU, Nombre, Descripcion FROM Producto WHERE IsActive = 1",
                commandType: CommandType.Text);
            return rows;
        }

        public async Task UpdateProductoAsync(int id, ProductoUpdateDto dto)
        {
            using var conn = _factory.Create();

            try
            {
                var affected = await conn.ExecuteAsync(
                    @"UPDATE Producto
              SET Nombre = @Nombre,
                  Descripcion = @Descripcion
              WHERE ProductoID = @Id AND IsActive = 1",
                    new { dto.Nombre, dto.Descripcion, Id = id }
                );

                if (affected == 0)
                {
                    throw new Exception("Producto no encontrado o inactivo");
                }
            }
            catch (SqlException ex)
            {
                Console.WriteLine($"[SQL Error] {ex.Message}");
                throw new Exception("Error al actualizar el producto en la base de datos");
            }
        }
        public async Task<ProductoDetalleDto?> GetProductoDetalleAsync(int productoId)
        {
            using var conn = _factory.Create();
            var detalle = await conn.QueryFirstOrDefaultAsync<ProductoDetalleDto>(
                "dbo.usp_Producto_Detalle",
                new { ProductoID = productoId },
                commandType: CommandType.StoredProcedure
            );
            return detalle;
        }
    }
}
