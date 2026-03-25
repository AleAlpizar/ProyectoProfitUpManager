using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Enums;
using ProfitManagerApp.Api.Infrastructure;
using ProfitManagerApp.Api.Models.Rows;

namespace ProfitManagerApp.Api.Service.Reporting
{
    public class ClientesReportService
    {
        private readonly AppDbContext _db;

        public ClientesReportService(AppDbContext db)
        {
            _db = db;
        }

        public Task<IReadOnlyList<ClienteComprasMensualesModel>> GetComprasMensualesAsync(
            int anio,
            CancellationToken ct)
        {
            return GetComprasMensualesAsync(anio, null, null, null, ct);
        }

        public async Task<IReadOnlyList<ClienteComprasMensualesModel>> GetComprasMensualesAsync(
            int? anio,
            int? clienteId,
            int? mesDesde,
            int? mesHasta,
            CancellationToken ct)
        {
            var year = NormalizeYear(anio);

            if (clienteId.HasValue && clienteId.Value <= 0)
                throw new ArgumentOutOfRangeException(nameof(clienteId), "El clienteId debe ser mayor a 0.");

            ValidateMonthRange(mesDesde, mesHasta);

            var query =
                from v in _db.Ventas.AsNoTracking()
                where v.Fecha.Year == year
                      && v.ClienteID != null
                      && v.Estado != EstadoVentaEnum.Anulada
                      && (!clienteId.HasValue || v.ClienteID == clienteId.Value)
                      && (!mesDesde.HasValue || v.Fecha.Month >= mesDesde.Value)
                      && (!mesHasta.HasValue || v.Fecha.Month <= mesHasta.Value)
                group v by new { v.Fecha.Year, v.Fecha.Month } into g
                orderby g.Key.Month
                select new ClienteComprasMensualesModel
                {
                    Anio = g.Key.Year,
                    Mes = g.Key.Month,
                    TotalClientes = g.Select(x => x.ClienteID).Distinct().Count(),
                    TotalVentas = g.Count(),
                    MontoTotal = g.Sum(x => x.Total)
                };

            return await query.ToListAsync(ct);
        }

        public async Task<IReadOnlyList<ClienteTopModel>> GetTopClientesAsync(
            int? anio,
            int? mesDesde,
            int? mesHasta,
            CancellationToken ct)
        {
            int? normalizedYear = anio.HasValue ? NormalizeYear(anio) : null;
            ValidateMonthRange(mesDesde, mesHasta);

            var query =
                from v in _db.Ventas.AsNoTracking()
                where v.ClienteID != null
                      && v.Estado != EstadoVentaEnum.Anulada
                      && (!normalizedYear.HasValue || v.Fecha.Year == normalizedYear.Value)
                      && (!mesDesde.HasValue || v.Fecha.Month >= mesDesde.Value)
                      && (!mesHasta.HasValue || v.Fecha.Month <= mesHasta.Value)
                group v by v.ClienteID into g
                orderby g.Sum(x => x.Total) descending, g.Count() descending
                select new ClienteTopModel
                {
                    ClienteID = g.Key!.Value,
                    TotalVentas = g.Count(),
                    MontoTotal = g.Sum(x => x.Total),
                    TicketPromedio = g.Count() == 0
                        ? 0
                        : g.Sum(x => x.Total) / g.Count(),
                    UltimaCompra = g.Max(x => x.Fecha)
                };

            return await query.ToListAsync(ct);
        }

        public async Task<IReadOnlyList<ClienteInactivoModel>> GetClientesInactivosAsync(
            int mesesSinCompra,
            CancellationToken ct)
        {
            if (mesesSinCompra <= 0)
            {
                mesesSinCompra = 3;
            }

            var now = DateTime.UtcNow;
            var limite = now.AddMonths(-mesesSinCompra);

            var agrupado = await (
                from v in _db.Ventas.AsNoTracking()
                where v.ClienteID != null
                      && v.Estado != EstadoVentaEnum.Anulada
                group v by v.ClienteID into g
                select new
                {
                    ClienteID = g.Key!.Value,
                    TotalVentas = g.Count(),
                    MontoTotal = g.Sum(x => x.Total),
                    UltimaCompra = g.Max(x => x.Fecha)
                }
            ).ToListAsync(ct);

            var resultado = agrupado
                .Where(x => x.UltimaCompra <= limite)
                .Select(x => new ClienteInactivoModel
                {
                    ClienteID = x.ClienteID,
                    TotalVentas = x.TotalVentas,
                    MontoTotal = x.MontoTotal,
                    UltimaCompra = x.UltimaCompra,
                    MesesSinCompra = CalculateFullMonthsDifference(x.UltimaCompra, now)
                })
                .OrderBy(x => x.UltimaCompra)
                .ThenByDescending(x => x.MontoTotal)
                .ToList();

            return resultado;
        }

        public async Task<IReadOnlyList<ClienteVentaDetalleModel>> GetVentasClienteAsync(
            int clienteId,
            int? anio,
            int? mesDesde,
            int? mesHasta,
            CancellationToken ct)
        {
            if (clienteId <= 0)
                throw new ArgumentOutOfRangeException(nameof(clienteId), "El clienteId debe ser mayor a 0.");

            var normalizedYear = anio.HasValue ? (int?)NormalizeYear(anio) : null;
            ValidateMonthRange(mesDesde, mesHasta);

            var query =
                from v in _db.Ventas.AsNoTracking()
                where v.ClienteID == clienteId
                      && v.Estado != EstadoVentaEnum.Anulada
                      && (!normalizedYear.HasValue || v.Fecha.Year == normalizedYear.Value)
                      && (!mesDesde.HasValue || v.Fecha.Month >= mesDesde.Value)
                      && (!mesHasta.HasValue || v.Fecha.Month <= mesHasta.Value)
                join d in _db.VentaDetalles.AsNoTracking() on v.VentaID equals d.VentaID into detGroup
                orderby v.Fecha descending, v.VentaID descending
                select new ClienteVentaDetalleModel
                {
                    VentaID = v.VentaID,
                    Fecha = v.Fecha,
                    SubTotal = v.Subtotal,
                    Descuento = v.Descuento,
                    Total = v.Total,
                    CantidadLineas = detGroup.Count()
                };

            return await query.ToListAsync(ct);
        }

        private static int NormalizeYear(int? anio)
        {
            if (!anio.HasValue || anio.Value <= 0)
                return DateTime.UtcNow.Year;

            return anio.Value;
        }

        private static void ValidateMonthRange(int? mesDesde, int? mesHasta)
        {
            if (mesDesde.HasValue && (mesDesde.Value < 1 || mesDesde.Value > 12))
                throw new ArgumentOutOfRangeException(nameof(mesDesde), "mesDesde debe estar entre 1 y 12.");

            if (mesHasta.HasValue && (mesHasta.Value < 1 || mesHasta.Value > 12))
                throw new ArgumentOutOfRangeException(nameof(mesHasta), "mesHasta debe estar entre 1 y 12.");

            if (mesDesde.HasValue && mesHasta.HasValue && mesDesde.Value > mesHasta.Value)
                throw new ArgumentException("mesDesde no puede ser mayor que mesHasta.");
        }

        private static int CalculateFullMonthsDifference(DateTime from, DateTime to)
        {
            if (to < from)
                return 0;

            var months = ((to.Year - from.Year) * 12) + to.Month - from.Month;
            if (to.Day < from.Day)
                months--;

            return Math.Max(0, months);
        }
    }
}