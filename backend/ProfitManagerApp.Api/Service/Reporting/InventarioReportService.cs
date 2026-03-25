using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Enums;
using ProfitManagerApp.Api.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ProfitManagerApp.Api.Service.Reporting
{
    public class InventarioReportService
    {
        private readonly AppDbContext _db;
        private const decimal UMBRAL_STOCK_CRITICO = 3m;

        public InventarioReportService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<InventarioDashboardDto> GetDashboardAsync(
            DateTime? fechaDesde,
            DateTime? fechaHasta,
            int? bodegaId,
            int? productoId,
            int[]? productosClaveIds,
            CancellationToken ct)
        {
            if (bodegaId.HasValue && bodegaId.Value <= 0)
                throw new ArgumentException("El parámetro bodegaId debe ser mayor que cero.", nameof(bodegaId));

            if (productoId.HasValue && productoId.Value <= 0)
                throw new ArgumentException("El parámetro productoId debe ser mayor que cero.", nameof(productoId));

            if (!fechaDesde.HasValue && !fechaHasta.HasValue)
            {
                var today = DateTime.UtcNow.Date;
                fechaHasta = today;
                fechaDesde = today.AddDays(-29);
            }

            fechaDesde = fechaDesde?.Date;
            fechaHasta = fechaHasta?.Date;

            if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde.Value > fechaHasta.Value)
                throw new ArgumentException("La fecha desde no puede ser mayor que la fecha hasta.");

            var hastaExclusive = fechaHasta?.AddDays(1);

            var invQuery = _db.Inventarios.AsNoTracking();

            if (bodegaId.HasValue)
                invQuery = invQuery.Where(i => i.BodegaID == bodegaId.Value);

            if (productoId.HasValue)
                invQuery = invQuery.Where(i => i.ProductoID == productoId.Value);

            var inventarios = await invQuery.ToListAsync(ct);

            var productoIds = inventarios
                .Select(i => i.ProductoID)
                .Distinct()
                .ToList();

            var bodegaIds = inventarios
                .Select(i => i.BodegaID)
                .Distinct()
                .ToList();

            var productos = await _db.Productos
                .AsNoTracking()
                .Where(p => productoIds.Contains(p.ProductoID) && p.IsActive)
                .ToDictionaryAsync(p => p.ProductoID, ct);

            inventarios = inventarios
                .Where(i => productos.ContainsKey(i.ProductoID))
                .ToList();

            productoIds = inventarios
                .Select(i => i.ProductoID)
                .Distinct()
                .ToList();

            bodegaIds = inventarios
                .Select(i => i.BodegaID)
                .Distinct()
                .ToList();

            var bodegas = await _db.Bodegas
                .AsNoTracking()
                .Where(b => bodegaIds.Contains(b.BodegaID))
                .ToDictionaryAsync(b => b.BodegaID, ct);

            var stockActualRows = inventarios
                .Select(i =>
                {
                    productos.TryGetValue(i.ProductoID, out var p);
                    bodegas.TryGetValue(i.BodegaID, out var b);

                    var precioCosto = p?.PrecioCosto ?? 0m;
                    var cantidadReservada = 0m;
                    var disponible = i.Cantidad;

                    return new StockActualRowDto
                    {
                        ProductoID = i.ProductoID,
                        SKU = p?.Sku ?? string.Empty,
                        NombreProducto = p?.Nombre ?? "(Producto)",
                        BodegaID = i.BodegaID,
                        NombreBodega = b?.Nombre ?? $"Bodega {i.BodegaID}",
                        Cantidad = i.Cantidad,
                        CantidadReservada = cantidadReservada,
                        Disponible = decimal.Round(disponible, 2),
                        PrecioCosto = precioCosto,
                        ValorCosto = decimal.Round(i.Cantidad * precioCosto, 2)
                    };
                })
                .OrderBy(r => r.NombreProducto)
                .ThenBy(r => r.NombreBodega)
                .ToList();

            var stockAgrupadoPorProducto = stockActualRows
                .GroupBy(r => r.ProductoID)
                .Select(g => new
                {
                    ProductoID = g.Key,
                    SKU = g.Select(x => x.SKU).FirstOrDefault() ?? string.Empty,
                    NombreProducto = g.Select(x => x.NombreProducto).FirstOrDefault() ?? "(Producto)",
                    CantidadTotal = g.Sum(x => x.Disponible)
                })
                .ToList();

            var stockCritico = stockAgrupadoPorProducto
                .Where(x => x.CantidadTotal <= UMBRAL_STOCK_CRITICO)
                .Select(x => new StockCriticoRowDto
                {
                    ProductoID = x.ProductoID,
                    SKU = x.SKU,
                    NombreProducto = x.NombreProducto,
                    BodegaID = 0,
                    NombreBodega = string.Empty,
                    Cantidad = x.CantidadTotal,
                    Umbral = UMBRAL_STOCK_CRITICO
                })
                .OrderBy(r => r.Cantidad)
                .ThenBy(r => r.NombreProducto)
                .ToList();

            var valorizacion = stockActualRows
                .GroupBy(r => r.BodegaID)
                .Select(g =>
                {
                    var nombreBodega = g.Select(x => x.NombreBodega).FirstOrDefault()
                        ?? $"Bodega {g.Key}";

                    decimal valorCosto = 0m;
                    decimal valorVenta = 0m;

                    foreach (var r in g)
                    {
                        productos.TryGetValue(r.ProductoID, out var p);

                        var precioCosto = p?.PrecioCosto ?? 0m;
                        var precioVenta = p?.PrecioVenta ?? 0m;
                        var descuento = p?.Descuento ?? 0m;
                        var precioVentaConDesc = precioVenta * (1m - (descuento / 100m));

                        valorCosto += r.Cantidad * precioCosto;
                        valorVenta += r.Cantidad * precioVentaConDesc;
                    }

                    return new InventarioValorizadoRowDto
                    {
                        ProductoID = 0,
                        SKU = string.Empty,
                        NombreProducto = "(Total bodega)",
                        BodegaID = g.Key,
                        NombreBodega = nombreBodega,
                        Cantidad = g.Sum(x => x.Cantidad),
                        PrecioCosto = 0m,
                        PrecioVenta = 0m,
                        Descuento = 0m,
                        ValorCosto = decimal.Round(valorCosto, 2),
                        ValorVenta = decimal.Round(valorVenta, 2),
                        MargenPotencial = decimal.Round(valorVenta - valorCosto, 2)
                    };
                })
                .OrderBy(v => v.NombreBodega)
                .ToList();

            var ventasQuery = _db.Ventas.AsNoTracking();

            if (fechaDesde.HasValue)
                ventasQuery = ventasQuery.Where(v => v.Fecha >= fechaDesde.Value);

            if (hastaExclusive.HasValue)
                ventasQuery = ventasQuery.Where(v => v.Fecha < hastaExclusive.Value);

            ventasQuery = ventasQuery.Where(v => v.Estado != EstadoVentaEnum.Anulada);

            var ventasPeriodo = await ventasQuery.ToListAsync(ct);
            var ventaIds = ventasPeriodo.Select(v => v.VentaID).ToList();

            var ventaItemsQuery = _db.VentaDetalles
                .AsNoTracking()
                .Where(d => ventaIds.Contains(d.VentaID));

            if (productoId.HasValue)
                ventaItemsQuery = ventaItemsQuery.Where(d => d.ProductoID == productoId.Value);

            if (bodegaId.HasValue)
                ventaItemsQuery = ventaItemsQuery.Where(d => d.BodegaID == bodegaId.Value);

            var ventaItemsPeriodo = await ventaItemsQuery.ToListAsync(ct);

            var movQuery = _db.MovimientosInventario.AsNoTracking();

            if (fechaDesde.HasValue)
                movQuery = movQuery.Where(m => m.FechaMovimiento >= fechaDesde.Value);

            if (hastaExclusive.HasValue)
                movQuery = movQuery.Where(m => m.FechaMovimiento < hastaExclusive.Value);

            if (bodegaId.HasValue)
                movQuery = movQuery.Where(m => m.BodegaID == bodegaId.Value);

            if (productoId.HasValue)
                movQuery = movQuery.Where(m => m.ProductoID == productoId.Value);

            var movimientos = await movQuery
                .OrderBy(m => m.FechaMovimiento)
                .ThenBy(m => m.MovimientoID)
                .ToListAsync(ct);

            var kardexProdIds = movimientos
                .Select(m => m.ProductoID)
                .Concat(
                    ventaItemsPeriodo
                        .Where(d => d.ProductoID.HasValue)
                        .Select(d => d.ProductoID!.Value))
                .Distinct()
                .ToList();

            var kardexBodIds = movimientos
                .Select(m => m.BodegaID)
                .Concat(ventaItemsPeriodo.Select(d => d.BodegaID))
                .Distinct()
                .ToList();

            var kardexProductos = await _db.Productos
                .AsNoTracking()
                .Where(p => kardexProdIds.Contains(p.ProductoID))
                .ToDictionaryAsync(p => p.ProductoID, ct);

            var kardexBodegas = await _db.Bodegas
                .AsNoTracking()
                .Where(b => kardexBodIds.Contains(b.BodegaID))
                .ToDictionaryAsync(b => b.BodegaID, ct);

            var ventasPorId = ventasPeriodo.ToDictionary(v => v.VentaID, v => v);

            var kardexList = new List<KardexMovimientoDto>();

            foreach (var m in movimientos)
            {
                kardexProductos.TryGetValue(m.ProductoID, out var p);
                kardexBodegas.TryGetValue(m.BodegaID, out var b);

                kardexList.Add(new KardexMovimientoDto
                {
                    MovimientoID = m.MovimientoID,
                    FechaMovimiento = m.FechaMovimiento,
                    TipoMovimiento = m.TipoMovimiento,
                    ProductoID = m.ProductoID,
                    SKU = p?.Sku ?? string.Empty,
                    NombreProducto = p?.Nombre ?? "(Producto)",
                    BodegaID = m.BodegaID,
                    NombreBodega = b?.Nombre ?? $"Bodega {m.BodegaID}",
                    Cantidad = m.Cantidad,
                    Motivo = m.Motivo,
                    ReferenciaTipo = m.ReferenciaTipo,
                    UsuarioID = m.UsuarioID
                });
            }

            var existingSaleMovementKeys = new HashSet<string>(
                movimientos
                    .Where(m =>
                        (!string.IsNullOrWhiteSpace(m.ReferenciaTipo) &&
                         m.ReferenciaTipo.Trim().Equals("VENTA", StringComparison.OrdinalIgnoreCase))
                        || (!string.IsNullOrWhiteSpace(m.TipoMovimiento) &&
                            m.TipoMovimiento.Trim().StartsWith("Salida", StringComparison.OrdinalIgnoreCase)))
                    .Select(m => BuildSyntheticVentaKey(
                        m.ProductoID,
                        m.BodegaID,
                        m.FechaMovimiento.Date,
                        m.Cantidad))
            );

            long syntheticId = long.MaxValue / 2;

            foreach (var d in ventaItemsPeriodo)
            {
                if (!d.ProductoID.HasValue)
                    continue;

                if (!ventasPorId.TryGetValue(d.VentaID, out var venta))
                    continue;

                var prodIdKdx = d.ProductoID.Value;
                var bodIdKdx = d.BodegaID;
                var key = BuildSyntheticVentaKey(prodIdKdx, bodIdKdx, venta.Fecha.Date, d.Cantidad);

                if (existingSaleMovementKeys.Contains(key))
                    continue;

                kardexProductos.TryGetValue(prodIdKdx, out var p);
                kardexBodegas.TryGetValue(bodIdKdx, out var b);

                kardexList.Add(new KardexMovimientoDto
                {
                    MovimientoID = syntheticId++,
                    FechaMovimiento = venta.Fecha,
                    TipoMovimiento = "Salida (Venta)",
                    ProductoID = prodIdKdx,
                    SKU = p?.Sku ?? string.Empty,
                    NombreProducto = p?.Nombre ?? "(Producto)",
                    BodegaID = bodIdKdx,
                    NombreBodega = b?.Nombre ?? $"Bodega {bodIdKdx}",
                    Cantidad = d.Cantidad,
                    Motivo = "Venta",
                    ReferenciaTipo = "VENTA",
                    UsuarioID = null
                });
            }

            var kardex = kardexList
                .OrderBy(k => k.FechaMovimiento)
                .ThenBy(k => k.MovimientoID)
                .ToList();

            var resumenMovimientos = kardex
                .GroupBy(k => NormalizeMovementType(k.TipoMovimiento))
                .Select(g => new MovimientoResumenDto
                {
                    TipoMovimiento = g.Key,
                    CantidadMovimientos = g.Count(),
                    CantidadTotal = g.Sum(x => x.Cantidad)
                })
                .OrderByDescending(x => x.CantidadMovimientos)
                .ThenBy(x => x.TipoMovimiento)
                .ToList();

            decimal diasPeriodo = 1m;
            if (fechaDesde.HasValue && fechaHasta.HasValue)
            {
                diasPeriodo = (decimal)(fechaHasta.Value.Date - fechaDesde.Value.Date).TotalDays + 1m;
                if (diasPeriodo <= 0) diasPeriodo = 1m;
            }

            var ventaPorProducto = ventaItemsPeriodo
                .Where(d => d.ProductoID.HasValue)
                .GroupBy(d => d.ProductoID!.Value)
                .ToDictionary(
                    g => g.Key,
                    g => g.Sum(x => x.Cantidad));

            var stockPorProducto = inventarios
                .GroupBy(i => i.ProductoID)
                .ToDictionary(
                    g => g.Key,
                    g => g.Sum(x => x.Cantidad));

            var productosTodosQuery = _db.Productos
                .AsNoTracking()
                .Where(p => p.IsActive);

            if (productoId.HasValue)
                productosTodosQuery = productosTodosQuery.Where(p => p.ProductoID == productoId.Value);

            var productosActivos = await productosTodosQuery.ToListAsync(ct);

            var rotacion = new List<RotacionInventarioSimpleDto>();

            foreach (var kv in ventaPorProducto)
            {
                var prodId = kv.Key;
                var vendida = kv.Value;
                stockPorProducto.TryGetValue(prodId, out var stockProd);

                if (vendida <= 0 && stockProd <= 0)
                    continue;

                var prod = productosActivos.FirstOrDefault(p => p.ProductoID == prodId)
                           ?? await _db.Productos.AsNoTracking().FirstOrDefaultAsync(p => p.ProductoID == prodId, ct);

                var divisor = stockProd > 0 ? stockProd : 1m;
                var rotValor = vendida / divisor;

                rotacion.Add(new RotacionInventarioSimpleDto
                {
                    ProductoID = prodId,
                    SKU = prod?.Sku ?? string.Empty,
                    NombreProducto = prod?.Nombre ?? "(Producto)",
                    CantidadVendidaPeriodo = vendida,
                    StockActual = stockProd,
                    Rotacion = decimal.Round(rotValor, 2)
                });
            }

            rotacion = rotacion
                .OrderByDescending(x => x.Rotacion)
                .ThenBy(x => x.NombreProducto)
                .Take(100)
                .ToList();

            var productosConVentas = new HashSet<int>(ventaPorProducto.Keys);
            var productosConMovimientos = new HashSet<int>(movimientos.Select(m => m.ProductoID));

            var productosSinMovimiento = productosActivos
                .Where(p =>
                    stockPorProducto.ContainsKey(p.ProductoID) &&
                    !productosConVentas.Contains(p.ProductoID) &&
                    !productosConMovimientos.Contains(p.ProductoID))
                .OrderBy(p => p.Nombre)
                .Take(200)
                .Select(p => new ProductoSinMovimientoInvDto
                {
                    ProductoID = p.ProductoID,
                    SKU = p.Sku ?? string.Empty,
                    NombreProducto = p.Nombre,
                    FechaCreacion = p.CreatedAt
                })
                .ToList();

            var stockPorProductoFiltrado = inventarios
                .GroupBy(i => i.ProductoID)
                .ToDictionary(
                    g => g.Key,
                    g => g.Sum(x => x.Cantidad));

            var consumoPromedioPorProducto = ventaPorProducto
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value / diasPeriodo);

            var cobertura = new List<CoberturaInventarioDto>();

            foreach (var p in productosActivos)
            {
                if (!stockPorProductoFiltrado.TryGetValue(p.ProductoID, out var stock))
                    continue;

                decimal consumoDia = 0m;
                consumoPromedioPorProducto.TryGetValue(p.ProductoID, out consumoDia);

                decimal diasCoberturaCalc = 0m;
                if (consumoDia > 0 && stock > 0)
                    diasCoberturaCalc = stock / consumoDia;

                cobertura.Add(new CoberturaInventarioDto
                {
                    ProductoID = p.ProductoID,
                    SKU = p.Sku ?? string.Empty,
                    NombreProducto = p.Nombre,
                    StockActual = stock,
                    ConsumoPromedioDia = decimal.Round(consumoDia, 4),
                    DiasCobertura = decimal.Round(diasCoberturaCalc, 1)
                });
            }

            cobertura = cobertura
                .Where(c => c.StockActual > 0)
                .OrderBy(c => c.DiasCobertura == 0 ? decimal.MaxValue : c.DiasCobertura)
                .ThenBy(c => c.NombreProducto)
                .Take(200)
                .ToList();

            var disponibilidadProductosClave = new List<ProductoDisponibilidadDto>();

            return new InventarioDashboardDto
            {
                FechaDesde = fechaDesde,
                FechaHasta = fechaHasta,
                StockActual = stockActualRows,
                StockCritico = stockCritico,
                Valorizacion = valorizacion,
                Kardex = kardex,
                ResumenMovimientos = resumenMovimientos,
                Rotacion = rotacion,
                ProductosSinMovimiento = productosSinMovimiento,
                DisponibilidadProductosClave = disponibilidadProductosClave,
                Cobertura = cobertura
            };
        }

        private static string NormalizeMovementType(string? tipoMovimiento)
        {
            var value = (tipoMovimiento ?? string.Empty).Trim();

            if (value.StartsWith("Entrada", StringComparison.OrdinalIgnoreCase))
                return "Entrada";

            if (value.StartsWith("Salida", StringComparison.OrdinalIgnoreCase))
                return "Salida";

            return string.IsNullOrWhiteSpace(value) ? "Otro" : value;
        }

        private static string BuildSyntheticVentaKey(int productoId, int bodegaId, DateTime fecha, decimal cantidad)
        {
            return $"{productoId}|{bodegaId}|{fecha:yyyyMMdd}|{cantidad:0.####}";
        }
    }
}