using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Enums;
using ProfitManagerApp.Api.Infrastructure;
using ProfitManagerApp.Api.Models.Rows;
using ProfitManagerApp.Api.Rows;

namespace ProfitManagerApp.Api.Service.Reporting
{
    public class VentasReportService
    {
        private readonly AppDbContext _db;

        public VentasReportService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<VentasDashboardDto> GetDashboardAsync(
            DateTime? fechaDesde,
            DateTime? fechaHasta,
            CancellationToken ct)
        {
            if (!fechaDesde.HasValue && !fechaHasta.HasValue)
            {
                var today = DateTime.UtcNow.Date;
                fechaHasta = today;
                fechaDesde = today.AddDays(-29);
            }

            fechaDesde = fechaDesde?.Date;
            fechaHasta = fechaHasta?.Date;

            DateTime? hastaExclusive = fechaHasta?.AddDays(1);

            var ventasQuery = _db.Ventas
                .AsNoTracking()
                .Where(v => v.Estado != EstadoVentaEnum.Anulada);

            if (fechaDesde.HasValue)
                ventasQuery = ventasQuery.Where(v => v.Fecha >= fechaDesde.Value);

            if (hastaExclusive.HasValue)
                ventasQuery = ventasQuery.Where(v => v.Fecha < hastaExclusive.Value);

            var ventasList = await ventasQuery.ToListAsync(ct);
            var ventaIds = ventasList.Select(v => v.VentaID).ToList();

            var totalVentas = ventasList.Count;
            var montoTotal = ventasList.Sum(v => v.Total);
            var ticketPromedioGlobal = totalVentas > 0
                ? Math.Round(montoTotal / totalVentas, 2, MidpointRounding.AwayFromZero)
                : 0m;

            var porDia = ventasList
                .GroupBy(v => v.Fecha.Date)
                .OrderBy(g => g.Key)
                .Select(g =>
                {
                    var count = g.Count();
                    var sum = g.Sum(x => x.Total);
                    var ticket = count > 0
                        ? Math.Round(sum / count, 2, MidpointRounding.AwayFromZero)
                        : 0m;

                    return new VentasRendimientoDiaDto
                    {
                        Fecha = g.Key,
                        CantidadVentas = count,
                        MontoTotal = sum,
                        TicketPromedio = ticket
                    };
                })
                .ToList();

            var porMes = ventasList
                .GroupBy(v => new { v.Fecha.Year, v.Fecha.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g =>
                {
                    var count = g.Count();
                    var sum = g.Sum(x => x.Total);
                    var ticket = count > 0
                        ? Math.Round(sum / count, 2, MidpointRounding.AwayFromZero)
                        : 0m;

                    return new VentasRendimientoMesDto
                    {
                        Anio = g.Key.Year,
                        Mes = g.Key.Month,
                        CantidadVentas = count,
                        MontoTotal = sum,
                        TicketPromedio = ticket
                    };
                })
                .ToList();

            var detallesList = await _db.VentaDetalles
                .AsNoTracking()
                .Where(d => ventaIds.Contains(d.VentaID))
                .ToListAsync(ct);

            var productosIds = detallesList
                .Where(d => d.ProductoID.HasValue)
                .Select(d => d.ProductoID!.Value)
                .Distinct()
                .ToList();

            var bodegasIds = detallesList
                .Select(d => d.BodegaID)
                .Distinct()
                .ToList();

            var productos = await _db.Productos
                .AsNoTracking()
                .Where(p => productosIds.Contains(p.ProductoID))
                .ToDictionaryAsync(p => p.ProductoID, ct);

            var bodegas = await _db.Bodegas
                .AsNoTracking()
                .Where(b => bodegasIds.Contains(b.BodegaID))
                .ToDictionaryAsync(b => b.BodegaID, ct);

            var topProductos = detallesList
                .Where(d => d.ProductoID.HasValue)
                .GroupBy(d => d.ProductoID!.Value)
                .Select(g =>
                {
                    var prodId = g.Key;
                    productos.TryGetValue(prodId, out var prod);

                    var cantidad = g.Sum(x => x.Cantidad);
                    var monto = g.Sum(x => x.Cantidad * x.PrecioUnitario);

                    var costoUnit = 0m;
                    var margen = g.Sum(x => (x.PrecioUnitario - costoUnit) * x.Cantidad);

                    return new VentasTopProductoDto
                    {
                        ProductoID = prodId,
                        Sku = prod?.Sku ?? string.Empty,
                        Nombre = prod?.Nombre ?? "(Producto)",
                        CantidadVendida = cantidad,
                        MontoVendido = decimal.Round(monto, 2, MidpointRounding.AwayFromZero),
                        MargenBruto = decimal.Round(margen, 2, MidpointRounding.AwayFromZero)
                    };
                })
                .OrderByDescending(x => x.MontoVendido)
                .Take(20)
                .ToList();

            var productosActivos = await _db.Productos
                .AsNoTracking()
                .Where(p => p.IsActive)
                .ToListAsync(ct);

            var productosConVentaSet = new HashSet<int>(productosIds);
            var productosSinMovimiento = productosActivos
                .Where(p => !productosConVentaSet.Contains(p.ProductoID))
                .OrderBy(p => p.Nombre)
                .Take(50)
                .Select(p => new ProductoSinMovimientoDto
                {
                    ProductoID = p.ProductoID,
                    Sku = p.Sku,
                    Nombre = p.Nombre
                })
                .ToList();

            var ventasPorBodega = detallesList
                .GroupBy(d => d.BodegaID)
                .Select(g =>
                {
                    bodegas.TryGetValue(g.Key, out var bod);
                    var monto = g.Sum(x => x.Cantidad * x.PrecioUnitario);

                    return new VentasPorBodegaDto
                    {
                        BodegaID = g.Key,
                        NombreBodega = bod?.Nombre ?? $"Bodega {g.Key}",
                        CantidadVendida = g.Sum(x => x.Cantidad),
                        MontoVendido = Math.Round(monto, 2, MidpointRounding.AwayFromZero)
                    };
                })
                .OrderByDescending(x => x.MontoVendido)
                .ToList();

            var inventarios = await _db.Inventarios
                .AsNoTracking()
                .Where(i => productosActivos.Select(p => p.ProductoID).Contains(i.ProductoID))
                .ToListAsync(ct);

            var stockPorProducto = inventarios
                .GroupBy(i => i.ProductoID)
                .ToDictionary(
                    g => g.Key,
                    g => g.Sum(x => x.Cantidad)
                );

            var cantVendidaPorProducto = detallesList
                .Where(d => d.ProductoID.HasValue)
                .GroupBy(d => d.ProductoID!.Value)
                .ToDictionary(
                    g => g.Key,
                    g => g.Sum(x => x.Cantidad)
                );

            var rotacionInventario = new List<RotacionInventarioDto>();

            foreach (var prod in productosActivos)
            {
                cantVendidaPorProducto.TryGetValue(prod.ProductoID, out var vendida);
                stockPorProducto.TryGetValue(prod.ProductoID, out var stock);

                if (vendida <= 0 && stock <= 0) continue;

                var divisor = stock > 0 ? stock : 1m;
                var indice = vendida / divisor;

                rotacionInventario.Add(new RotacionInventarioDto
                {
                    ProductoID = prod.ProductoID,
                    Sku = prod.Sku,
                    Nombre = prod.Nombre,
                    CantidadVendida = vendida,
                    StockActual = stock,
                    IndiceRotacion = Math.Round(indice, 2, MidpointRounding.AwayFromZero)
                });
            }

            rotacionInventario = rotacionInventario
                .OrderByDescending(x => x.IndiceRotacion)
                .Take(50)
                .ToList();

            const decimal UMBRAL_STOCK_BAJO = 3m;

            var posiblesIssues = new List<VentaStockIssueDto>();

            foreach (var prod in productosActivos)
            {
                cantVendidaPorProducto.TryGetValue(prod.ProductoID, out var vendido);
                stockPorProducto.TryGetValue(prod.ProductoID, out var stockTotal);

                if (vendido <= 0)
                    continue;

                if (stockTotal > UMBRAL_STOCK_BAJO)
                    continue;

                var criticidad = vendido / (stockTotal <= 0 ? 1 : stockTotal);

                posiblesIssues.Add(new VentaStockIssueDto
                {
                    ProductoID = prod.ProductoID,
                    BodegaID = 0,
                    Sku = prod.Sku ?? string.Empty,
                    NombreProducto = prod.Nombre ?? "(Producto)",
                    StockActual = stockTotal,
                    CantidadVendidaPeriodo = vendido,
                    IndiceCriticidad = Math.Round(criticidad, 2, MidpointRounding.AwayFromZero)
                });
            }

            posiblesIssues = posiblesIssues
                .OrderByDescending(x => x.IndiceCriticidad)
                .Take(50)
                .ToList();

            var anulacionesQuery = _db.VentaAnulaciones
                .AsNoTracking();

            if (fechaDesde.HasValue)
                anulacionesQuery = anulacionesQuery.Where(a => a.FechaAnulacion >= fechaDesde.Value);
            if (hastaExclusive.HasValue)
                anulacionesQuery = anulacionesQuery.Where(a => a.FechaAnulacion < hastaExclusive.Value);

            var anulacionesList = await anulacionesQuery.ToListAsync(ct);

            var ventaIdsAnuladas = anulacionesList
                .Select(a => a.VentaID)
                .Distinct()
                .ToList();

            var ventasAnuladas = await _db.Ventas
                .AsNoTracking()
                .Where(v => ventaIdsAnuladas.Contains(v.VentaID))
                .ToDictionaryAsync(v => v.VentaID, ct);

            var anulacionesPorUsuario = anulacionesList
                .Where(a => a.UsuarioID.HasValue)
                .GroupBy(a => a.UsuarioID!.Value)
                .Select(g =>
                {
                    var totalAnulado = g.Sum(a =>
                    {
                        return ventasAnuladas.TryGetValue(a.VentaID, out var v)
                            ? v.Total
                            : 0m;
                    });

                    return new AnulacionPorUsuarioDto
                    {
                        UsuarioID = g.Key,
                        CantidadAnulaciones = g.Count(),
                        MontoTotalAnulado = Math.Round(totalAnulado, 2, MidpointRounding.AwayFromZero)
                    };
                })
                .OrderByDescending(x => x.CantidadAnulaciones)
                .ToList();

            var anulacionesDetalle = anulacionesList
                .Select(a =>
                {
                    ventasAnuladas.TryGetValue(a.VentaID, out var v);
                    return new VentaAnulacionDetalleDto
                    {
                        AnulacionID = a.AnulacionID,
                        VentaID = a.VentaID,
                        FechaAnulacion = a.FechaAnulacion,
                        Motivo = a.Motivo,
                        UsuarioID = a.UsuarioID,
                        TotalVenta = v?.Total ?? 0m
                    };
                })
                .OrderByDescending(x => x.FechaAnulacion)
                .ToList();

            return new VentasDashboardDto
            {
                FechaDesde = fechaDesde,
                FechaHasta = fechaHasta,
                TotalVentas = totalVentas,
                MontoTotal = Math.Round(montoTotal, 2, MidpointRounding.AwayFromZero),
                TicketPromedioGlobal = ticketPromedioGlobal,
                PorDia = porDia,
                PorMes = porMes,
                TopProductos = topProductos,
                ProductosSinMovimiento = productosSinMovimiento,
                VentasPorBodega = ventasPorBodega,
                RotacionInventario = rotacionInventario,
                PosiblesProblemasStock = posiblesIssues,
                AnulacionesPorUsuario = anulacionesPorUsuario,
                AnulacionesDetalle = anulacionesDetalle
            };
        }
    }
}
