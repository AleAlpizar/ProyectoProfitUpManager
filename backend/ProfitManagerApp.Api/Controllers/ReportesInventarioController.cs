using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Service.Reporting;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/reportes/inventario")]
    [AllowAnonymous]
    public class ReportesInventarioController : ControllerBase
    {
        private readonly InventarioReportService _service;

        public ReportesInventarioController(InventarioReportService service)
        {
            _service = service;
        }

        [HttpGet("dashboard")]
        [AllowAnonymous]
        public async Task<ActionResult<InventarioDashboardDto>> GetDashboard(
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta,
            [FromQuery] int? bodegaId,
            [FromQuery] int? productoId,
            [FromQuery] int[]? productosClaveIds,
            CancellationToken ct)
        {
            var data = await _service.GetDashboardAsync(
                fechaDesde,
                fechaHasta,
                bodegaId,
                productoId,
                productosClaveIds,
                ct);

            return Ok(data);
        }
    }
}
