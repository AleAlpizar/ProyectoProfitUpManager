using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Service.Reporting;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/reportes/ventas")]
    [AllowAnonymous]
    public class ReportesVentasController : ControllerBase
    {
        private readonly VentasReportService _service;

        public ReportesVentasController(VentasReportService service)
        {
            _service = service;
        }

        [HttpGet("dashboard")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(VentasDashboardDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<VentasDashboardDto>> GetDashboard(
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta,
            CancellationToken ct)
        {
            if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde.Value.Date > fechaHasta.Value.Date)
            {
                return BadRequest(new
                {
                    message = "La fecha inicial no puede ser mayor que la fecha final."
                });
            }

            var data = await _service.GetDashboardAsync(fechaDesde, fechaHasta, ct);
            return Ok(data);
        }
    }
}