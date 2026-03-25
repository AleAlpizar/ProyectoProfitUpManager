using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Data.Abstractions;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Services;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VencimientosController : ControllerBase
    {
        private readonly IVencimientosRepository _repo;
        private readonly IVencimientosNotificationService _notificationService;

        public VencimientosController(
            IVencimientosRepository repo,
            IVencimientosNotificationService notificationService)
        {
            _repo = repo;
            _notificationService = notificationService;
        }

        [HttpGet("calendario")]
        public async Task<IActionResult> Calendario(
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta,
            [FromQuery] bool soloPendientes = true)
        {
            if (desde.HasValue && hasta.HasValue && desde.Value.Date > hasta.Value.Date)
            {
                return Problem(
                    title: "VALIDATION_ERROR",
                    detail: "La fecha 'desde' no puede ser mayor que la fecha 'hasta'.",
                    statusCode: 400);
            }

            var rows = await _repo.ListCalendarioAsync(desde, hasta, soloPendientes);
            return Ok(rows);
        }

        [HttpGet("alertas")]
        public async Task<IActionResult> Alertas([FromQuery] int umbralDefault = 7)
        {
            if (umbralDefault < 0 || umbralDefault > 365)
            {
                return Problem(
                    title: "VALIDATION_ERROR",
                    detail: "El umbral por defecto debe estar entre 0 y 365 días.",
                    statusCode: 400);
            }

            try
            {
                var rows = await _repo.ListAlertasPendientesAsync(umbralDefault);
                return Ok(rows);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Vencimientos.Alertas] Error: {ex}");

                return Problem(
                    title: "ALERTAS_ERROR",
                    detail: ex.Message,
                    statusCode: 500
                );
            }
        }

        [HttpPost("procesar-alertas")]
        public async Task<IActionResult> ProcesarAlertas([FromQuery] int umbralDefault = 7, CancellationToken ct = default)
        {
            if (umbralDefault < 0 || umbralDefault > 365)
            {
                return Problem(
                    title: "VALIDATION_ERROR",
                    detail: "El umbral por defecto debe estar entre 0 y 365 días.",
                    statusCode: 400);
            }

            var enviados = await _notificationService.ProcesarAlertasYEnviarCorreosAsync(umbralDefault, ct);
            return Ok(new { enviados });
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            if (id <= 0)
            {
                return Problem(
                    title: "VALIDATION_ERROR",
                    detail: "El identificador del documento es inválido.",
                    statusCode: 400);
            }

            var dto = await _repo.GetByIdAsync(id);
            if (dto is null) return NotFound(new { error = "Documento no encontrado." });

            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VencimientoUpdateDto dto)
        {
            if (dto is null) return BadRequest(new { error = "BODY_REQUIRED" });

            try
            {
                var newId = await _repo.CreateAsync(dto);
                return CreatedAtAction(
                    nameof(GetById),
                    new { id = newId },
                    new
                    {
                        documentoVencimientoID = newId,
                        message = "Vencimiento registrado correctamente."
                    });
            }
            catch (ArgumentException ex)
            {
                return Problem(title: "VALIDATION_ERROR", detail: ex.Message, statusCode: 400);
            }
            catch (Exception ex)
            {
                return Problem(title: "CREATE_ERROR", detail: ex.Message, statusCode: 500);
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] VencimientoUpdateDto dto)
        {
            if (id <= 0)
            {
                return Problem(
                    title: "VALIDATION_ERROR",
                    detail: "El identificador del documento es inválido.",
                    statusCode: 400);
            }

            if (dto is null) return BadRequest(new { error = "BODY_REQUIRED" });

            try
            {
                await _repo.UpdateAsync(id, dto);
                return Ok(new { message = "Vencimiento actualizado correctamente." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = "Documento no encontrado." });
            }
            catch (ArgumentException ex)
            {
                return Problem(title: "VALIDATION_ERROR", detail: ex.Message, statusCode: 400);
            }
            catch (Exception ex)
            {
                return Problem(title: "UPDATE_ERROR", detail: ex.Message, statusCode: 500);
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            if (id <= 0)
            {
                return Problem(
                    title: "VALIDATION_ERROR",
                    detail: "El identificador del documento es inválido.",
                    statusCode: 400);
            }

            try
            {
                await _repo.DeleteAsync(id);
                return Ok(new { message = "Vencimiento eliminado correctamente." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = "Documento no encontrado." });
            }
            catch (Exception ex)
            {
                return Problem(title: "DELETE_ERROR", detail: ex.Message, statusCode: 500);
            }
        }
    }
}