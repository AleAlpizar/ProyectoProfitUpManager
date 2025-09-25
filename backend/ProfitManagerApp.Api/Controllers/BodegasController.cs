using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Domain.Inventory.Dto;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BodegasController : ControllerBase
    {
        private readonly IInventarioRepository _repo;
        public BodegasController(IInventarioRepository repo) => _repo = repo;

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var data = await _repo.GetBodegasAsync();
            return Ok(data);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BodegaCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            int? userId = null;
            var idClaim = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(idClaim, out var idVal)) userId = idVal;

            try
            {
                var bodegaId = await _repo.CrearBodegaAsync(dto, userId);
                return Created($"/api/bodegas/{bodegaId}", new { bodegaId });
            }
            catch (SqlException ex) when (ex.Message.Contains("FIELD_REQUIRED:Nombre"))
            {
                return BadRequest(new { error = "El nombre es obligatorio." });
            }
            catch (SqlException ex) when (ex.Message.Contains("BODEGA_CODIGO_DUPLICATE"))
            {
                return Conflict(new { error = "El código de bodega ya existe." });
            }
        }
    }
}
