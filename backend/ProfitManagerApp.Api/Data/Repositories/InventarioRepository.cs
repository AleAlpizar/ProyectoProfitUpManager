using Microsoft.Data.SqlClient;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Data.Abstractions;
using ProfitManagerApp.Domain.Inventory.Dto;
using System.Data;
using ProfitManagerApp.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace ProfitManagerApp.Data
{
    public sealed class InventarioRepository : IInventarioRepository
    {
        private readonly string _cs;
        private readonly AppDbContext _db;

        public InventarioRepository(IConfiguration cfg, AppDbContext db)
        {
            _cs = cfg.GetConnectionString("Default")
                  ?? throw new InvalidOperationException("Connection string 'Default' no configurada.");
            _db = db;
        }

        private static object DbNull(object? v) => v ?? DBNull.Value;

        public async Task<int> CrearProductoAsync(ProductoCreateDto dto, int? userId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            if (string.IsNullOrWhiteSpace(dto.Nombre))
                throw new SqlExceptionBuilder("FIELD_REQUIRED:Nombre");
            if (dto.PrecioVenta < 0)
                throw new SqlExceptionBuilder("FIELD_REQUIRED:PrecioVenta");

            if (!string.IsNullOrWhiteSpace(dto.SKU))
            {
                const string skuCheck = "SELECT 1 FROM dbo.Producto WHERE SKU=@sku";
                await using var skuCmd = new SqlCommand(skuCheck, cn);
                skuCmd.Parameters.AddWithValue("@sku", dto.SKU!);
                var exists = await skuCmd.ExecuteScalarAsync();
                if (exists != null)
                    throw new SqlExceptionBuilder("SKU_DUPLICATE");
            }

            const string insertSql = @"
INSERT INTO dbo.Producto
(SKU,Nombre,Descripcion,CodigoInterno,Peso,Largo,Alto,Ancho,UnidadAlmacenamientoID,
 PrecioCosto,PrecioVenta,IsActive,CreatedAt,CreatedBy,Descuento)
VALUES
(@SKU,@Nombre,@Descripcion,@CodigoInterno,@Peso,@Largo,@Alto,@Ancho,@UnidadAlmacenamientoID,
 @PrecioCosto,@PrecioVenta,1,SYSUTCDATETIME(),@CreatedBy,@Descuento);
SELECT CAST(SCOPE_IDENTITY() AS INT);";

            await using var cmd = new SqlCommand(insertSql, cn);
            cmd.Parameters.AddWithValue("@SKU", DbNull(dto.SKU));
            cmd.Parameters.AddWithValue("@Nombre", dto.Nombre);
            cmd.Parameters.AddWithValue("@Descripcion", DbNull(dto.Descripcion));
            cmd.Parameters.AddWithValue("@CodigoInterno", DbNull(dto.CodigoInterno));
            cmd.Parameters.AddWithValue("@Peso", DbNull(dto.Peso));
            cmd.Parameters.AddWithValue("@Largo", DbNull(dto.Largo));
            cmd.Parameters.AddWithValue("@Alto", DbNull(dto.Alto));
            cmd.Parameters.AddWithValue("@Ancho", DbNull(dto.Ancho));
            cmd.Parameters.AddWithValue("@UnidadAlmacenamientoID", DbNull(dto.UnidadAlmacenamientoID));
            cmd.Parameters.AddWithValue("@PrecioCosto", DbNull(dto.PrecioCosto));
            cmd.Parameters.AddWithValue("@PrecioVenta", dto.PrecioVenta);
            cmd.Parameters.AddWithValue("@CreatedBy", DbNull(userId));
            cmd.Parameters.AddWithValue("@Descuento", DbNull(dto.Descuento));

            var newIdObj = await cmd.ExecuteScalarAsync();
            var newId = Convert.ToInt32(newIdObj);

            if (dto.BodegaID.HasValue)
                await AsignarProductoBodegaAsync(newId, dto.BodegaID.Value);

            return newId;
        }

        public async Task AjusteAsync(AjusteInventarioDto dto, int? userId)
        {
            if (dto.Cantidad <= 0) throw new InvalidOperationException("INVALID_QTY");

            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();
            await using var tx = await cn.BeginTransactionAsync();

            try
            {
                const string ensureSql = @"
IF NOT EXISTS (SELECT 1 FROM dbo.Inventario WHERE ProductoID=@p AND BodegaID=@b)
    INSERT INTO dbo.Inventario(ProductoID,BodegaID,Cantidad,CantidadReservada,FechaUltimaActualizacion)
    VALUES(@p,@b,0,0,SYSUTCDATETIME());";
                await using (var ensure = new SqlCommand(ensureSql, cn, (SqlTransaction)tx))
                {
                    ensure.Parameters.AddWithValue("@p", dto.ProductoID);
                    ensure.Parameters.AddWithValue("@b", dto.BodegaID);
                    await ensure.ExecuteNonQueryAsync();
                }
                var isPositive =
                    dto.TipoMovimiento?.Equals("Entrada", StringComparison.OrdinalIgnoreCase) == true ||
                    dto.TipoMovimiento?.Equals("AjustePositivo", StringComparison.OrdinalIgnoreCase) == true ||
                    dto.TipoMovimiento?.Equals("AjusteManualEntrada", StringComparison.OrdinalIgnoreCase) == true;

                var sign = isPositive ? +1 : -1;

                if (sign < 0)
                {
                    const string disponibleSql = @"
SELECT (Cantidad - CantidadReservada) FROM dbo.Inventario
WHERE ProductoID=@p AND BodegaID=@b;";
                    await using var disp = new SqlCommand(disponibleSql, cn, (SqlTransaction)tx);
                    disp.Parameters.AddWithValue("@p", dto.ProductoID);
                    disp.Parameters.AddWithValue("@b", dto.BodegaID);
                    var dispObj = await disp.ExecuteScalarAsync();
                    var disponible = dispObj == null || dispObj == DBNull.Value ? 0m : Convert.ToDecimal(dispObj);
                    if (disponible < dto.Cantidad) throw new InvalidOperationException("STOCK_INSUFICIENTE");
                }

                const string upSql = @"
UPDATE dbo.Inventario
   SET Cantidad = Cantidad + (@k * @c),
       FechaUltimaActualizacion = SYSUTCDATETIME()
 WHERE ProductoID=@p AND BodegaID=@b;";
                await using (var up = new SqlCommand(upSql, cn, (SqlTransaction)tx))
                {
                    up.Parameters.AddWithValue("@k", sign);
                    up.Parameters.AddWithValue("@c", dto.Cantidad);
                    up.Parameters.AddWithValue("@p", dto.ProductoID);
                    up.Parameters.AddWithValue("@b", dto.BodegaID);
                    await up.ExecuteNonQueryAsync();
                }

                const string movSql = @"
INSERT INTO dbo.MovimientoInventario(ProductoID,BodegaID,TipoMovimiento,Cantidad,ReferenciaTipo,Motivo,FechaMovimiento,UsuarioID)
VALUES(@p,@b,@t,@c,NULL,@m,SYSUTCDATETIME(),@u);";
                await using (var mov = new SqlCommand(movSql, cn, (SqlTransaction)tx))
                {
                    mov.Parameters.AddWithValue("@p", dto.ProductoID);
                    mov.Parameters.AddWithValue("@b", dto.BodegaID);
                    mov.Parameters.AddWithValue("@t", dto.TipoMovimiento ?? (sign > 0 ? "Entrada" : "Salida"));
                    mov.Parameters.AddWithValue("@c", dto.Cantidad);
                    mov.Parameters.AddWithValue("@m", DbNull(dto.Motivo));
                    mov.Parameters.AddWithValue("@u", DbNull(userId));
                    await mov.ExecuteNonQueryAsync();
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }


        public async Task<ProductoDetalleDto?> GetProductoDetalleAsync(int productoId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            const string sql = @"
SELECT CodigoInterno,Peso,Largo,Alto,Ancho,UnidadAlmacenamientoID,PrecioCosto,PrecioVenta
FROM dbo.Producto
WHERE ProductoID=@id;";
            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@id", productoId);

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

            const string existSql = "SELECT IsActive FROM dbo.Producto WHERE ProductoID=@id;";
            await using (var e = new SqlCommand(existSql, cn))
            {
                e.Parameters.AddWithValue("@id", id);
                var val = await e.ExecuteScalarAsync();
                if (val is null) throw new Exception("Producto no encontrado");
            }

            if (!string.IsNullOrWhiteSpace(dto.SKU))
            {
                const string skuDup = "SELECT 1 FROM dbo.Producto WHERE SKU=@sku AND ProductoID<>@id;";
                await using var s = new SqlCommand(skuDup, cn);
                s.Parameters.AddWithValue("@sku", dto.SKU!);
                s.Parameters.AddWithValue("@id", id);
                var dup = await s.ExecuteScalarAsync();
                if (dup != null) throw new Exception("SKU_DUPLICATE");
            }

            const string updateSql = @"
UPDATE dbo.Producto SET
    Nombre = @Nombre,
    Descripcion = @Descripcion,
    SKU = @SKU,
    CodigoInterno = @CodigoInterno,
    UnidadAlmacenamientoID = @UnidadAlmacenamientoID,
    PrecioCosto = @PrecioCosto,
    PrecioVenta = @PrecioVenta,
    Peso = @Peso,
    Largo = @Largo,
    Alto = @Alto,
    Ancho = @Ancho,
    Descuento = @Descuento,
    UpdatedAt = SYSUTCDATETIME()
WHERE ProductoID = @Id;";
            await using var cmd = new SqlCommand(updateSql, cn);
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Nombre", dto.Nombre);
            cmd.Parameters.AddWithValue("@Descripcion", DbNull(dto.Descripcion));
            cmd.Parameters.AddWithValue("@SKU", DbNull(dto.SKU));
            cmd.Parameters.AddWithValue("@CodigoInterno", DbNull(dto.CodigoInterno));
            cmd.Parameters.AddWithValue("@UnidadAlmacenamientoID", DbNull(dto.UnidadAlmacenamientoID));
            cmd.Parameters.AddWithValue("@PrecioCosto", DbNull(dto.PrecioCosto));
            cmd.Parameters.AddWithValue("@PrecioVenta", DbNull(dto.PrecioVenta));
            cmd.Parameters.AddWithValue("@Peso", DbNull(dto.Peso));
            cmd.Parameters.AddWithValue("@Largo", DbNull(dto.Largo));
            cmd.Parameters.AddWithValue("@Alto", DbNull(dto.Alto));
            cmd.Parameters.AddWithValue("@Ancho", DbNull(dto.Ancho));
            cmd.Parameters.AddWithValue("@Descuento", DbNull(dto.Descuento));

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

        public async Task AsignarProductoBodegaAsync(int productoId, int bodegaId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            const string sql = @"
IF NOT EXISTS (SELECT 1 FROM dbo.Inventario WHERE ProductoID=@p AND BodegaID=@b)
    INSERT INTO dbo.Inventario(ProductoID,BodegaID,Cantidad,CantidadReservada,FechaUltimaActualizacion)
    VALUES(@p,@b,0,0,SYSUTCDATETIME());";

            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@p", productoId);
            cmd.Parameters.AddWithValue("@b", bodegaId);
            await cmd.ExecuteNonQueryAsync();
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

            var actual = await GetCantidadActualAsync(dto.ProductoID, dto.BodegaID);
            var delta = dto.NuevaCantidad - actual;
            if (delta == 0m) return;

            var tipo = delta > 0 ? "AjusteManualEntrada" : "AjusteManualSalida";

            await AjusteAsync(new AjusteInventarioDto
            {
                ProductoID = dto.ProductoID,
                BodegaID = dto.BodegaID,
                TipoMovimiento = tipo,
                Cantidad = Math.Abs(delta),
                Motivo = dto.Motivo
            }, userId);
        }


        public async Task InactivarProductoYRetirarStockAsync(int productoId, int? userId)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();
            await using var tx = await cn.BeginTransactionAsync();

            try
            {
                const string selInv = @"
SELECT BodegaID, (Cantidad - CantidadReservada) AS Disponible
FROM dbo.Inventario
WHERE ProductoID=@p AND (Cantidad - CantidadReservada) > 0;";
                var retiros = new List<(int bode, decimal cant)>();
                await using (var cmdSel = new SqlCommand(selInv, cn, (SqlTransaction)tx))
                {
                    cmdSel.Parameters.AddWithValue("@p", productoId);
                    await using var rd = await cmdSel.ExecuteReaderAsync();
                    while (await rd.ReadAsync())
                    {
                        retiros.Add((Convert.ToInt32(rd["BodegaID"]), Convert.ToDecimal(rd["Disponible"])));
                    }
                }

                foreach (var r in retiros)
                {
                    const string upInv = @"
UPDATE dbo.Inventario
   SET Cantidad = Cantidad - @cant,
       FechaUltimaActualizacion = SYSUTCDATETIME()
 WHERE ProductoID=@p AND BodegaID=@b;";
                    await using (var up = new SqlCommand(upInv, cn, (SqlTransaction)tx))
                    {
                        up.Parameters.AddWithValue("@cant", r.cant);
                        up.Parameters.AddWithValue("@p", productoId);
                        up.Parameters.AddWithValue("@b", r.bode);
                        await up.ExecuteNonQueryAsync();
                    }

                    const string insMov = @"
INSERT INTO dbo.MovimientoInventario(ProductoID,BodegaID,TipoMovimiento,Cantidad,ReferenciaTipo,Motivo,FechaMovimiento,UsuarioID)
VALUES(@p,@b,'RetiroPorInactivacion',@c,NULL,'Inactivación de producto',SYSUTCDATETIME(),@u);";
                    await using (var mov = new SqlCommand(insMov, cn, (SqlTransaction)tx))
                    {
                        mov.Parameters.AddWithValue("@p", productoId);
                        mov.Parameters.AddWithValue("@b", r.bode);
                        mov.Parameters.AddWithValue("@c", r.cant);
                        mov.Parameters.AddWithValue("@u", DbNull(userId));
                        await mov.ExecuteNonQueryAsync();
                    }
                }

                const string inactSql = @"
UPDATE dbo.Producto
   SET IsActive = 0, UpdatedAt = SYSUTCDATETIME()
 WHERE ProductoID = @p;";
                await using (var cmdInact = new SqlCommand(inactSql, cn, (SqlTransaction)tx))
                {
                    cmdInact.Parameters.AddWithValue("@p", productoId);
                    await cmdInact.ExecuteNonQueryAsync();
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task ActivarProductoAsync(int id)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            const string sql = @"UPDATE dbo.Producto SET IsActive=1, UpdatedAt=SYSUTCDATETIME() WHERE ProductoID=@id;";
            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@id", id);
            var rows = await cmd.ExecuteNonQueryAsync();
            if (rows == 0) throw new KeyNotFoundException();
        }

        public async Task UpdatePrecioVentaAsync(int id, decimal precioVenta)
        {
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            const string sql = @"UPDATE dbo.Producto SET PrecioVenta=@p, UpdatedAt=SYSUTCDATETIME() WHERE ProductoID=@id;";
            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@p", precioVenta);
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<IReadOnlyList<ProductoMiniDto>> GetProductosMiniAsync(string estado = "activos")
        {
            var list = new List<ProductoMiniDto>();
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            string where = estado.ToLower() switch
            {
                "inactivos" => "WHERE IsActive = 0",
                "todos" => "",
                _ => "WHERE IsActive = 1"
            };

            var sql = $@"
SELECT ProductoID, SKU, Nombre, Descripcion, Descuento, PrecioVenta, IsActive
FROM dbo.Producto
{where}
ORDER BY Nombre;";

            await using var cmd = new SqlCommand(sql, cn);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
            {
                list.Add(new ProductoMiniDto
                {
                    ProductoID = Convert.ToInt32(rd["ProductoID"]),
                    SKU = rd["SKU"] as string,
                    Nombre = rd["Nombre"] as string ?? "",
                    Descripcion = rd["Descripcion"] as string ?? "",
                    Descuento = rd["Descuento"] as decimal?,
                    PrecioVenta = rd["PrecioVenta"] as decimal?,
                    IsActive = Convert.ToBoolean(rd["IsActive"])
                });
            }
            return list;
        }

        public async Task<Dictionary<int, List<BodegaStockDto>>> GetBodegasConStockPorProductoAsync(
            IEnumerable<int> productoIds,
            CancellationToken ct = default)
        {
            var ids = productoIds.Distinct().ToList();
            if (ids.Count == 0) return new();

            var rows = await (
                from inv in _db.Inventarios.AsNoTracking()
                join bod in _db.Bodegas.AsNoTracking() on inv.BodegaID equals bod.BodegaID
                where ids.Contains(inv.ProductoID)
                   && inv.Cantidad > 0
                   && bod.IsActive
                select new { inv.ProductoID, bod.BodegaID, bod.Nombre, inv.Cantidad }
            ).ToListAsync(ct);

            var dict = ids.ToDictionary(
                pid => pid,
                pid => rows.Where(r => r.ProductoID == pid)
                           .OrderBy(r => r.Nombre)
                           .Select(r => new BodegaStockDto(r.BodegaID, r.Nombre, r.Cantidad))
                           .ToList()
            );

            return dict;
        }

        public async Task<IReadOnlyList<StockRowDto>> GetStockAsync(StockQueryDto query, CancellationToken ct = default)
        {
            var list = new List<StockRowDto>();
            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync(ct);

            await using var cmd = new SqlCommand("dbo.usp_Inventario_GetStock", cn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@ProductoID", (object?)query.ProductoID ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@BodegaID", (object?)query.BodegaID ?? DBNull.Value);

            await using var rd = await cmd.ExecuteReaderAsync(ct);
            while (await rd.ReadAsync(ct))
            {
                list.Add(new StockRowDto
                {
                    Producto = rd["Producto"] as string ?? "",
                    SKU = rd["SKU"] as string ?? "",
                    Bodega = rd["Bodega"] as string ?? "",
                    Existencia = rd["Existencia"] is DBNull ? 0m : Convert.ToDecimal(rd["Existencia"]),
                    Disponible = rd["Disponible"] is DBNull ? 0m : Convert.ToDecimal(rd["Disponible"])
                });
            }

            return list;
        }

        public async Task<(IReadOnlyList<InventarioMovimientoRowDto> Items, int Total)> GetHistorialAsync(
    InventarioHistorialQueryDto query,
    CancellationToken ct = default)
        {
            var items = new List<InventarioMovimientoRowDto>();

            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync(ct);

            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 50 : query.PageSize;
            if (pageSize > 200) pageSize = 200;
            var offset = (page - 1) * pageSize;

            var filters = new List<string>();

            if (query.ProductoID.HasValue) filters.Add("m.ProductoID = @ProductoID");
            if (query.BodegaID.HasValue) filters.Add("m.BodegaID = @BodegaID");
            if (query.UsuarioID.HasValue) filters.Add("m.UsuarioID = @UsuarioID");
            if (query.Desde.HasValue) filters.Add("m.FechaMovimiento >= @Desde");
            if (query.Hasta.HasValue) filters.Add("m.FechaMovimiento <= @Hasta");

            bool useTipoParam = false;
            if (!string.IsNullOrWhiteSpace(query.TipoMovimiento))
            {
                var t = query.TipoMovimiento;

                if (t.Equals("Entrada", StringComparison.OrdinalIgnoreCase))
                {
                    filters.Add("m.TipoMovimiento IN ('Entrada','AjustePositivo','AjusteManualEntrada')");
                }
                else if (t.Equals("Salida", StringComparison.OrdinalIgnoreCase))
                {
                    filters.Add("m.TipoMovimiento IN ('Salida','RetiroPorInactivacion','AjusteSalidaManual','AjusteManualSalida')");
                }
                else if (t.Equals("AjusteSalidaManual", StringComparison.OrdinalIgnoreCase))
                {
                    filters.Add("m.TipoMovimiento IN ('AjusteSalidaManual','AjusteManualEntrada','AjusteManualSalida')");
                }
                else
                {
                    filters.Add("m.TipoMovimiento = @TipoMovimiento");
                    useTipoParam = true;
                }
            }

            var whereSql = filters.Count > 0 ? "WHERE " + string.Join(" AND ", filters) : string.Empty;

            static void AddParameters(SqlCommand cmd, InventarioHistorialQueryDto q, bool useTipoParam, int? offsetParam = null, int? pageSizeParam = null)
            {
                if (q.ProductoID.HasValue) cmd.Parameters.AddWithValue("@ProductoID", q.ProductoID.Value);
                if (q.BodegaID.HasValue) cmd.Parameters.AddWithValue("@BodegaID", q.BodegaID.Value);
                if (useTipoParam && !string.IsNullOrWhiteSpace(q.TipoMovimiento))
                    cmd.Parameters.AddWithValue("@TipoMovimiento", q.TipoMovimiento);
                if (q.UsuarioID.HasValue) cmd.Parameters.AddWithValue("@UsuarioID", q.UsuarioID.Value);
                if (q.Desde.HasValue) cmd.Parameters.AddWithValue("@Desde", q.Desde.Value);
                if (q.Hasta.HasValue) cmd.Parameters.AddWithValue("@Hasta", q.Hasta.Value);
                if (offsetParam.HasValue) cmd.Parameters.AddWithValue("@Offset", offsetParam.Value);
                if (pageSizeParam.HasValue) cmd.Parameters.AddWithValue("@PageSize", pageSizeParam.Value);
            }

            var countSql = $@"
SELECT COUNT(*)
FROM dbo.MovimientoInventario m
{whereSql};";

            int total = 0;
            await using (var countCmd = new SqlCommand(countSql, cn))
            {
                AddParameters(countCmd, query, useTipoParam);
                var totalObj = await countCmd.ExecuteScalarAsync(ct);
                if (totalObj != null && totalObj != DBNull.Value)
                    total = Convert.ToInt32(totalObj);
            }

            var dataSql = $@"
WITH MovimientosFiltrados AS (
    SELECT
        m.MovimientoID,
        m.FechaMovimiento,
        m.ProductoID,
        p.Nombre AS ProductoNombre,
        p.SKU,
        m.BodegaID,
        b.Nombre AS BodegaNombre,
        m.TipoMovimiento,
        m.Cantidad,
        m.Motivo,
        m.ReferenciaTipo,
        m.UsuarioID,
        u.Nombre AS UsuarioNombre,
        CASE 
            WHEN m.TipoMovimiento IN ('Entrada','AjustePositivo','AjusteManualEntrada') 
                THEN m.Cantidad
            WHEN m.TipoMovimiento IN ('Salida','AjusteSalidaManual','AjusteManualSalida','RetiroPorInactivacion') 
                THEN -m.Cantidad
            ELSE 0
        END AS CantidadFirmada
    FROM dbo.MovimientoInventario m
    JOIN dbo.Producto p ON p.ProductoID = m.ProductoID
    JOIN dbo.Bodega b ON b.BodegaID = m.BodegaID
    LEFT JOIN dbo.Usuario u ON u.UsuarioID = m.UsuarioID
    {whereSql}
),
MovimientosConSaldo AS (
    SELECT
        MovimientoID,
        FechaMovimiento,
        ProductoID,
        ProductoNombre,
        SKU,
        BodegaID,
        BodegaNombre,
        TipoMovimiento,
        Cantidad,
        Motivo,
        ReferenciaTipo,
        UsuarioID,
        UsuarioNombre,
        CantidadFirmada,
        SUM(CantidadFirmada) OVER (
            PARTITION BY ProductoID, BodegaID
            ORDER BY FechaMovimiento, MovimientoID
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS SaldoNuevo
    FROM MovimientosFiltrados
)
SELECT
    MovimientoID,
    FechaMovimiento,
    ProductoID,
    ProductoNombre,
    SKU,
    BodegaID,
    BodegaNombre,
    TipoMovimiento,
    Cantidad,
    CASE WHEN CantidadFirmada = 0 THEN NULL ELSE SaldoNuevo - CantidadFirmada END AS SaldoAnterior,
    SaldoNuevo,
    Motivo,
    ReferenciaTipo,
    UsuarioID,
    UsuarioNombre
FROM MovimientosConSaldo
ORDER BY FechaMovimiento DESC, MovimientoID DESC
OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

            await using (var cmd = new SqlCommand(dataSql, cn))
            {
                AddParameters(cmd, query, useTipoParam, offset, pageSize);

                await using var rd = await cmd.ExecuteReaderAsync(ct);
                while (await rd.ReadAsync(ct))
                {
                    var row = new InventarioMovimientoRowDto
                    {
                        MovimientoID = rd.GetInt64(rd.GetOrdinal("MovimientoID")),
                        FechaMovimiento = rd.GetDateTime(rd.GetOrdinal("FechaMovimiento")),
                        ProductoID = rd.GetInt32(rd.GetOrdinal("ProductoID")),
                        ProductoNombre = rd["ProductoNombre"] as string ?? "",
                        SKU = rd["SKU"] as string,
                        BodegaID = rd.GetInt32(rd.GetOrdinal("BodegaID")),
                        BodegaNombre = rd["BodegaNombre"] as string ?? "",
                        TipoMovimiento = rd["TipoMovimiento"] as string ?? "",
                        Cantidad = rd.GetDecimal(rd.GetOrdinal("Cantidad")),
                        SaldoAnterior = rd["SaldoAnterior"] is DBNull ? null : rd.GetDecimal(rd.GetOrdinal("SaldoAnterior")),
                        SaldoNuevo = rd["SaldoNuevo"] is DBNull ? null : rd.GetDecimal(rd.GetOrdinal("SaldoNuevo")),
                        Motivo = rd["Motivo"] as string,
                        ReferenciaTipo = rd["ReferenciaTipo"] as string,
                        UsuarioID = rd["UsuarioID"] is DBNull ? null : rd.GetInt32(rd.GetOrdinal("UsuarioID")),
                        UsuarioNombre = rd["UsuarioNombre"] as string
                    };
                    items.Add(row);
                }
            }

            return (items, total);
        }


    }

    internal sealed class SqlExceptionBuilder : Exception
    {
        public SqlExceptionBuilder(string message) : base(message) { }
    }
}
