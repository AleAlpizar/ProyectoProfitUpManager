using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Domain.Inventory.Dto;
using ProfitManagerApp.Api.Dtos;

namespace ProfitManagerApp.Data
{
    public sealed class InventarioRepository : IInventarioRepository
    {
        private readonly string _cs;

        public InventarioRepository(IConfiguration cfg)
        {
            _cs = cfg.GetConnectionString("Default")
                  ?? throw new InvalidOperationException("Connection string 'Default' no configurada.");
        }

        public async Task<int> CrearProductoAsync(ProductoCreateDto dto, int? userId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.usp_Producto_Create", cn)
            { CommandType = CommandType.StoredProcedure };

            cmd.Parameters.AddWithValue("@Nombre", (object)dto.Nombre ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@PrecioVenta", dto.PrecioVenta);
            cmd.Parameters.AddWithValue("@SKU", (object?)dto.SKU ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Descripcion", (object?)dto.Descripcion ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CodigoInterno", (object?)dto.CodigoInterno ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@UnidadAlmacenamientoID", (object?)dto.UnidadAlmacenamientoID ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@PrecioCosto", (object?)dto.PrecioCosto ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Peso", (object?)dto.Peso ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Largo", (object?)dto.Largo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Alto", (object?)dto.Alto ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Ancho", (object?)dto.Ancho ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@BodegaID", (object?)dto.BodegaID ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CreatedBy", (object?)userId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Descuento", (object?)dto.Descuento ?? DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            if (result is null || result == DBNull.Value)
                throw new InvalidOperationException("No se recibió ProductoID al crear el producto.");

            return Convert.ToInt32(result);
        }

        public async Task AjusteAsync(AjusteInventarioDto dto, int? userId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.usp_Inventario_Ajuste", cn)
            { CommandType = CommandType.StoredProcedure };

            cmd.Parameters.AddWithValue("@ProductoID", dto.ProductoID);
            cmd.Parameters.AddWithValue("@BodegaID", dto.BodegaID);
            cmd.Parameters.AddWithValue("@TipoMovimiento", dto.TipoMovimiento ?? "AjustePositivo");
            cmd.Parameters.AddWithValue("@Cantidad", dto.Cantidad);
            cmd.Parameters.AddWithValue("@Motivo", (object?)dto.Motivo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@UsuarioID", (object?)userId ?? DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<ProductoDetalleDto?> GetProductoDetalleAsync(int productoId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.usp_Producto_Detalle", cn)
            { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@ProductoID", productoId);

            await using var rd = await cmd.ExecuteReaderAsync(CommandBehavior.SingleResult);
            if (!await rd.ReadAsync()) return null;

            return new ProductoDetalleDto
            {
                CodigoInterno = rd["CodigoInterno"] as string,
                Peso = rd["Peso"] as decimal?,
                Largo = rd["Largo"] as decimal?,
                Alto = rd["Alto"] as decimal?,
                Ancho = rd["Ancho"] as decimal?,
                UnidadAlmacenamientoID = rd["UnidadAlmacenamientoID"] as int?,
                PrecioCosto = rd["PrecioCosto"] as decimal?,
                PrecioVenta = rd["PrecioVenta"] as decimal?,
            };
        }

        public async Task UpdateProductoAsync(int id, ProductoUpdateDto dto)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            const string sql = @"
UPDATE dbo.Producto
   SET Nombre = @Nombre,
       Descripcion = @Descripcion,
       Descuento = COALESCE(@Descuento, Descuento),
       UpdatedAt = SYSUTCDATETIME()
 WHERE ProductoID = @Id AND IsActive = 1;

IF @@ROWCOUNT = 0
    THROW 51002, 'Producto no encontrado o inactivo', 1;";

            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Nombre", dto.Nombre);
            cmd.Parameters.AddWithValue("@Descripcion", (object?)dto.Descripcion ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Descuento", (object?)dto.Descuento ?? DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<bool> ExisteProductoAsync(int productoId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            const string sql = @"SELECT 1 FROM dbo.Producto WHERE ProductoID=@p AND IsActive=1";
            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@p", productoId);

            var obj = await cmd.ExecuteScalarAsync();
            return obj != null;
        }

        public async Task<bool> ExisteBodegaAsync(int bodegaId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            const string sql = @"SELECT 1 FROM dbo.Bodega WHERE BodegaID=@b AND IsActive=1";
            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@b", bodegaId);

            var obj = await cmd.ExecuteScalarAsync();
            return obj != null;
        }

        public async Task<bool> ExisteAsignacionAsync(int productoId, int bodegaId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            const string sql = @"SELECT 1 FROM dbo.Inventario WHERE ProductoID=@p AND BodegaID=@b";
            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@p", productoId);
            cmd.Parameters.AddWithValue("@b", bodegaId);

            var obj = await cmd.ExecuteScalarAsync();
            return obj != null;
        }

        public async Task<decimal> GetCantidadActualAsync(int productoId, int bodegaId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            const string sql = @"SELECT CAST(ISNULL(Cantidad,0) AS DECIMAL(18,4))
                                 FROM dbo.Inventario
                                 WHERE ProductoID=@p AND BodegaID=@b";
            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@p", productoId);
            cmd.Parameters.AddWithValue("@b", bodegaId);

            var obj = await cmd.ExecuteScalarAsync();
            return obj == null || obj == DBNull.Value ? 0m : Convert.ToDecimal(obj);
        }

        public async Task SetCantidadAbsolutaAsync(InventarioSetCantidadDto dto, int? userId)
        {
            if (dto is null) throw new ArgumentNullException(nameof(dto));
            if (dto.NuevaCantidad < 0) throw new ArgumentOutOfRangeException(nameof(dto.NuevaCantidad));

            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            const string ensureSql = @"
IF NOT EXISTS (SELECT 1 FROM dbo.Inventario WHERE ProductoID=@p AND BodegaID=@b)
    INSERT INTO dbo.Inventario(ProductoID,BodegaID,Cantidad,CantidadReservada)
    VALUES(@p,@b,0,0);";
            await using (var ensure = new SqlCommand(ensureSql, cn))
            {
                ensure.Parameters.AddWithValue("@p", dto.ProductoID);
                ensure.Parameters.AddWithValue("@b", dto.BodegaID);
                await ensure.ExecuteNonQueryAsync();
            }

            var actual = await GetCantidadActualAsync(dto.ProductoID, dto.BodegaID);
            var delta = dto.NuevaCantidad - actual;
            if (delta == 0m) return;

            var tipo = delta > 0 ? "Entrada" : "Salida";
            var cant = Math.Abs(delta);

            await using var cmd = new SqlCommand("dbo.usp_Inventario_Ajuste", cn)
            { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@ProductoID", dto.ProductoID);
            cmd.Parameters.AddWithValue("@BodegaID", dto.BodegaID);
            cmd.Parameters.AddWithValue("@TipoMovimiento", tipo);
            cmd.Parameters.AddWithValue("@Cantidad", cant);
            cmd.Parameters.AddWithValue("@Motivo", (object?)dto.Motivo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@UsuarioID", (object?)userId ?? DBNull.Value);
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task InactivarProductoYRetirarStockAsync(int productoId, int? userId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();
            await using var tx = await cn.BeginTransactionAsync();

            try
            {
                const string inactSql = @"
UPDATE dbo.Producto
   SET IsActive = 0, UpdatedAt = SYSUTCDATETIME()
 WHERE ProductoID = @p;";
                await using (var cmdInact = new SqlCommand(inactSql, cn, (SqlTransaction)tx))
                {
                    cmdInact.Parameters.AddWithValue("@p", productoId);
                    await cmdInact.ExecuteNonQueryAsync();
                }

                const string selInv = @"
SELECT BodegaID, (Cantidad - CantidadReservada) AS Disponible
FROM dbo.Inventario
WHERE ProductoID=@p AND (Cantidad - CantidadReservada) > 0";
                var retiros = new List<(int bodegaId, decimal cant)>();
                await using (var cmdSel = new SqlCommand(selInv, cn, (SqlTransaction)tx))
                {
                    cmdSel.Parameters.AddWithValue("@p", productoId);
                    await using var rd = await cmdSel.ExecuteReaderAsync();
                    while (await rd.ReadAsync())
                    {
                        var b = Convert.ToInt32(rd["BodegaID"]);
                        var d = Convert.ToDecimal(rd["Disponible"]);
                        retiros.Add((b, d));
                    }
                }

                foreach (var r in retiros)
                {
                    await using var cmdAdj = new SqlCommand("dbo.usp_Inventario_Ajuste", cn, (SqlTransaction)tx)
                    { CommandType = CommandType.StoredProcedure };
                    cmdAdj.Parameters.AddWithValue("@ProductoID", productoId);
                    cmdAdj.Parameters.AddWithValue("@BodegaID", r.bodegaId);
                    cmdAdj.Parameters.AddWithValue("@TipoMovimiento", "Salida");
                    cmdAdj.Parameters.AddWithValue("@Cantidad", r.cant);
                    cmdAdj.Parameters.AddWithValue("@Motivo", "Retiro por inactivación de producto");
                    cmdAdj.Parameters.AddWithValue("@UsuarioID", (object?)userId ?? DBNull.Value);
                    await cmdAdj.ExecuteNonQueryAsync();
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task AsignarProductoBodegaAsync(int productoId, int bodegaId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            const string sql = @"
MERGE dbo.Inventario AS tgt
USING (SELECT @p AS ProductoID, @b AS BodegaID) AS src
   ON tgt.ProductoID = src.ProductoID AND tgt.BodegaID = src.BodegaID
WHEN NOT MATCHED THEN
    INSERT (ProductoID, BodegaID, Cantidad, CantidadReservada, FechaUltimaActualizacion)
    VALUES (src.ProductoID, src.BodegaID, 0, 0, SYSUTCDATETIME());";

            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@p", productoId);
            cmd.Parameters.AddWithValue("@b", bodegaId);
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<IReadOnlyList<ProductoMiniDto>> GetProductosMiniAsync()
        {
            var list = new List<ProductoMiniDto>();
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            try
            {
                await using var cmd = new SqlCommand("dbo.usp_Producto_MiniList", cn)
                { CommandType = CommandType.StoredProcedure };
                await using var rd = await cmd.ExecuteReaderAsync();
                while (await rd.ReadAsync())
                {
                    list.Add(new ProductoMiniDto
                    {
                        ProductoID = Convert.ToInt32(rd["ProductoID"]),
                        SKU = rd["SKU"] as string ?? string.Empty,
                        Nombre = rd["Nombre"] as string ?? string.Empty,
                        PrecioVenta = (decimal?)(rd["PrecioVenta"]),
                        Descripcion = rd["Descripcion"] as string ?? "",
                        Descuento = rd["Descuento"] as decimal?
                    });
                }
                return list;
            }
            catch (SqlException ex) when (ex.Number == 2812)
            {
                const string sql = @"
SELECT ProductoID, SKU, Nombre, Descripcion, Descuento
FROM dbo.Producto
WHERE IsActive = 1
ORDER BY Nombre;";
                await using var cmd2 = new SqlCommand(sql, cn);
                await using var rd2 = await cmd2.ExecuteReaderAsync();
                while (await rd2.ReadAsync())
                {
                    list.Add(new ProductoMiniDto
                    {
                        ProductoID = Convert.ToInt32(rd2["ProductoID"]),
                        SKU = rd2["SKU"] as string ?? string.Empty,
                        Nombre = rd2["Nombre"] as string ?? string.Empty,
                        Descripcion = rd2["Descripcion"] as string,
                        Descuento = rd2["Descuento"] as decimal?
                    });
                }
                return list;
            }
        }
    }
}
