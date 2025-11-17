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
        public async Task<ActionResult<VentasDashboardDto>> GetDashboard(
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta,
            CancellationToken ct)
        {
            var data = await _service.GetDashboardAsync(fechaDesde, fechaHasta, ct);
            return Ok(data);
        }
    }
}
