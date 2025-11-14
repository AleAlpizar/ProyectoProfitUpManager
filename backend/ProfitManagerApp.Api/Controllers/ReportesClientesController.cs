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
            [FromQuery] int anio,
            CancellationToken ct)
        {
            var data = await _service.GetComprasMensualesAsync(anio, ct);

            var dto = data.Select(r => new ClienteComprasMensualesDto(
                r.Anio,
                r.Mes,
                r.TotalClientes,
                r.TotalVentas,
                r.MontoTotal
            ));

            return Ok(dto);
        }
    }
}
