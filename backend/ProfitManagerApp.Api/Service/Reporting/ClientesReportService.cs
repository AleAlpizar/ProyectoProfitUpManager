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

        public async Task<IReadOnlyList<ClienteComprasMensualesModel>> GetComprasMensualesAsync(
            int anio,
            CancellationToken ct)
        {
            if (anio <= 0)
                anio = DateTime.UtcNow.Year;

            var query =
                from v in _db.Ventas
                where v.Fecha.Year == anio
                      && v.ClienteID != null
                      && v.Estado != EstadoVentaEnum.Anulada  
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
    }
}
