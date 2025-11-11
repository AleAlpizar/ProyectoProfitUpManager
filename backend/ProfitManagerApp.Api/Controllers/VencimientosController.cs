using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Data.Abstractions;
using ProfitManagerApp.Api.Dtos;
using System.Linq;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VencimientosController : ControllerBase
    {
        private readonly IVencimientosRepository _repo;
        public VencimientosController(IVencimientosRepository repo) => _repo = repo;

        [HttpGet("calendario")]
        public async Task<IActionResult> Calendario(
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta,
            [FromQuery] bool soloPendientes = true)
        {
            var rows = await _repo.ListCalendarioAsync(desde, hasta, soloPendientes);
            return Ok(rows);
        }

        [HttpGet("alertas")]
        public async Task<IActionResult> Alertas([FromQuery] int umbralDefault = 7)
        {
            var rows = await _repo.ListAlertasPendientesAsync(umbralDefault);
            return Ok(rows);
        }

        [HttpGet("tipos")]
        public async Task<IActionResult> Tipos()
        {
            var rows = await _repo.ListTiposActivosAsync();
            var shaped = rows.Select(t => new
            {
                tipoDocumentoVencimientoID = t.TipoDocumentoVencimientoID,
                nombre = t.Nombre,
                descripcion = t.Descripcion,
                activo = t.IsActive
            });
            return Ok(shaped);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var dto = await _repo.GetByIdAsync(id);
            if (dto is null) return NotFound(new { error = "Documento no encontrado." });
            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VencimientoUpdateDto dto)
        {
            if (dto is null) return BadRequest(new { error = "BODY_REQUIRED" });
            if (string.IsNullOrWhiteSpace(dto.Titulo))
                return Problem(title: "FIELD_REQUIRED:Titulo", statusCode: 400);
            if (dto.FechaVencimiento == default)
                return Problem(title: "FIELD_REQUIRED:FechaVencimiento", statusCode: 400);

            try
            {
                var newId = await _repo.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = newId }, new { documentoVencimientoID = newId });
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
            if (dto is null) return BadRequest(new { error = "BODY_REQUIRED" });
            if (string.IsNullOrWhiteSpace(dto.Titulo))
                return Problem(title: "FIELD_REQUIRED:Titulo", statusCode: 400);
            if (dto.FechaVencimiento == default)
                return Problem(title: "FIELD_REQUIRED:FechaVencimiento", statusCode: 400);

            try
            {
                await _repo.UpdateAsync(id, dto);
                return NoContent();
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
            try
            {
                await _repo.DeleteAsync(id);
                return NoContent();
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
