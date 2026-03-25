using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Service.Reporting;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/reportes/clientes")]
    [Authorize]
    public class ReportesClientesController : ControllerBase
    {
        private readonly ClientesReportService _service;

        public ReportesClientesController(ClientesReportService service)
        {
            _service = service;
        }

        [HttpGet("compras-mensuales")]
        public async Task<ActionResult<IEnumerable<ClienteComprasMensualesDto>>> GetComprasMensuales(
            [FromQuery] int? anio,
            [FromQuery] int? clienteId,
            [FromQuery] int? mesDesde,
            [FromQuery] int? mesHasta,
            CancellationToken ct)
        {
            if (!ValidateReportFilters(anio, clienteId, mesDesde, mesHasta))
                return ValidationProblem(ModelState);

            var data = await _service.GetComprasMensualesAsync(
                anio,
                clienteId,
                mesDesde,
                mesHasta,
                ct
            );

            var dto = data.Select(r => new ClienteComprasMensualesDto(
                r.Anio,
                r.Mes,
                r.TotalClientes,
                r.TotalVentas,
                r.MontoTotal
            ));

            return Ok(dto);
        }

        [HttpGet("top")]
        public async Task<ActionResult<IEnumerable<ClienteTopDto>>> GetTopClientes(
            [FromQuery] int? anio,
            [FromQuery] int? mesDesde,
            [FromQuery] int? mesHasta,
            CancellationToken ct)
        {
            if (!ValidateReportFilters(anio, null, mesDesde, mesHasta))
                return ValidationProblem(ModelState);

            var data = await _service.GetTopClientesAsync(
                anio,
                mesDesde,
                mesHasta,
                ct
            );

            var dto = data.Select(r => new ClienteTopDto(
                r.ClienteID,
                r.TotalVentas,
                r.MontoTotal,
                r.TicketPromedio,
                r.UltimaCompra
            ));

            return Ok(dto);
        }

        [HttpGet("inactivos")]
        public async Task<ActionResult<IEnumerable<ClienteInactivoDto>>> GetClientesInactivos(
            [FromQuery] int? meses,
            CancellationToken ct)
        {
            var mesesValor = meses.GetValueOrDefault(3);

            if (mesesValor < 1 || mesesValor > 60)
            {
                ModelState.AddModelError(nameof(meses), "El parámetro meses debe estar entre 1 y 60.");
                return ValidationProblem(ModelState);
            }

            var data = await _service.GetClientesInactivosAsync(mesesValor, ct);

            var dto = data.Select(r => new ClienteInactivoDto(
                r.ClienteID,
                r.TotalVentas,
                r.MontoTotal,
                r.UltimaCompra,
                r.MesesSinCompra
            ));

            return Ok(dto);
        }

        [HttpGet("ventas-cliente")]
        public async Task<ActionResult<IEnumerable<ClienteVentaDetalleDto>>> GetVentasCliente(
            [FromQuery] int clienteId,
            [FromQuery] int? anio,
            [FromQuery] int? mesDesde,
            [FromQuery] int? mesHasta,
            CancellationToken ct)
        {
            if (!ValidateReportFilters(anio, clienteId, mesDesde, mesHasta))
                return ValidationProblem(ModelState);

            var data = await _service.GetVentasClienteAsync(
                clienteId,
                anio,
                mesDesde,
                mesHasta,
                ct
            );

            var dto = data.Select(r => new ClienteVentaDetalleDto(
                r.VentaID,
                r.Fecha,
                r.SubTotal,
                r.Descuento,
                r.Total,
                r.CantidadLineas
            ));

            return Ok(dto);
        }

        private bool ValidateReportFilters(int? anio, int? clienteId, int? mesDesde, int? mesHasta)
        {
            var currentYear = System.DateTime.UtcNow.Year + 1;

            if (anio.HasValue && (anio.Value < 2000 || anio.Value > currentYear))
                ModelState.AddModelError(nameof(anio), $"El año debe estar entre 2000 y {currentYear}.");

            if (clienteId.HasValue && clienteId.Value <= 0)
                ModelState.AddModelError(nameof(clienteId), "clienteId debe ser mayor a 0.");

            if (mesDesde.HasValue && (mesDesde.Value < 1 || mesDesde.Value > 12))
                ModelState.AddModelError(nameof(mesDesde), "mesDesde debe estar entre 1 y 12.");

            if (mesHasta.HasValue && (mesHasta.Value < 1 || mesHasta.Value > 12))
                ModelState.AddModelError(nameof(mesHasta), "mesHasta debe estar entre 1 y 12.");

            if (mesDesde.HasValue && mesHasta.HasValue && mesDesde.Value > mesHasta.Value)
                ModelState.AddModelError("rangoMeses", "mesDesde no puede ser mayor que mesHasta.");

            return ModelState.IsValid;
        }
    }
}