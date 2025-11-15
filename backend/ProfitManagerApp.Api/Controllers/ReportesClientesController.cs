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
            if (mesesValor <= 0)
                mesesValor = 3;

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
            if (clienteId <= 0)
            {
                return BadRequest("clienteId es requerido.");
            }

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
    }
}
