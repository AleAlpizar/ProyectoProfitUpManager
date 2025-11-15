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
            var year = (anio.HasValue && anio.Value > 0)
                ? anio.Value
                : DateTime.UtcNow.Year;

            var query =
                from v in _db.Ventas
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
            var query =
                from v in _db.Ventas
                where v.ClienteID != null
                      && v.Estado != EstadoVentaEnum.Anulada
                      && (!anio.HasValue || v.Fecha.Year == anio.Value)
                      && (!mesDesde.HasValue || v.Fecha.Month >= mesDesde.Value)
                      && (!mesHasta.HasValue || v.Fecha.Month <= mesHasta.Value)
                group v by v.ClienteID into g
                orderby g.Sum(x => x.Total) descending
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
                from v in _db.Ventas
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
                .OrderBy(x => x.UltimaCompra)
                .Select(x => new ClienteInactivoModel
                {
                    ClienteID = x.ClienteID,
                    TotalVentas = x.TotalVentas,
                    MontoTotal = x.MontoTotal,
                    UltimaCompra = x.UltimaCompra,
                    MesesSinCompra = mesesSinCompra
                })
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
            var query =
                from v in _db.Ventas
                where v.ClienteID == clienteId
                      && v.Estado != EstadoVentaEnum.Anulada
                      && (!anio.HasValue || v.Fecha.Year == anio.Value)
                      && (!mesDesde.HasValue || v.Fecha.Month >= mesDesde.Value)
                      && (!mesHasta.HasValue || v.Fecha.Month <= mesHasta.Value)
                join d in _db.VentaDetalles on v.VentaID equals d.VentaID into detGroup
                orderby v.Fecha descending
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
    }
}
