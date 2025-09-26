using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Domain.Inventory.Dto;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;


namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InventarioController : ControllerBase
    {
        private readonly IInventarioRepository _repo;
        public InventarioController(IInventarioRepository repo) => _repo = repo;

        private int? GetUserId()
        {
            var v =
                User.FindFirstValue("uid") ??
                User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return int.TryParse(v, out var id) ? id : (int?)null;
        }

        [HttpGet("acceso")]
        public async Task<IActionResult> Acceso([FromQuery] string modulo = "Inventario", [FromQuery] string accion = "Leer")
        {
            var uid = GetUserId();
            if (uid is null) return Unauthorized();

            var allowed = await _repo.PuedeAccederModuloAsync(uid.Value, modulo, accion);
            if (!allowed) return Forbid();

            return Ok(new { allowed = true });
        }

        [HttpGet("stock")]
        public async Task<IActionResult> GetStock([FromQuery] int? productoId, [FromQuery] int? bodegaId)
        {
            var uid = GetUserId();
            if (uid is null) return Unauthorized();

            var allowed = await _repo.PuedeAccederModuloAsync(uid.Value, "Inventario", "Leer");
            if (!allowed) return Forbid();

            var rows = await _repo.GetStockAsync(productoId, bodegaId);
            return Ok(rows);
        }

        [HttpPost("ajuste")]
        public async Task<IActionResult> Ajuste([FromBody] AjusteInventarioDto dto)
        {
            var uid = GetUserId();
            if (uid is null) return Unauthorized();

            var allowed = await _repo.PuedeAccederModuloAsync(uid.Value, "Inventario", "Escribir");
            if (!allowed) return Forbid();

            try
            {
                await _repo.AjusteAsync(dto, uid);
                return Ok(new { message = "Ajuste aplicado" });
            }
            catch (Exception ex) when (ex.Message == "INVALID_QTY")
            {
                return BadRequest(new { error = "Cantidad inválida" });
            }
            catch (Exception ex) when (ex.Message == "STOCK_INSUFICIENTE")
            {
                return BadRequest(new { error = "Stock insuficiente para la salida" });
            }
        }
        [HttpGet("bodegas")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBodegas()
        {
            var list = await _repo.GetBodegasAsync();
            return Ok(list);
        }
        [HttpGet("debug/db")]
        [AllowAnonymous] 
        public async Task<IActionResult> DebugDb()
        {
            var info = await _repo.DebugDbAsync();
            return Ok(new { info.Server, info.Database, info.ProcId });
        }

        [HttpGet("unidades")]
        [AllowAnonymous] 
        public async Task<IActionResult> GetUnidades()
        {
            var list = await _repo.GetUnidadesAsync();
            return Ok(list);
        }

        [HttpGet("debug/unidades")]
        [AllowAnonymous]   
        public async Task<IActionResult> DebugUnidades()
        {
            var info = await _repo.DebugUnidadesAsync();
            return Ok(new { info.Server, info.Database, info.ProcId });
        }
        [HttpGet("productos/mini")]
        public async Task<IActionResult> GetProductosMini()
        {
            var uid = GetUserId();
            if (uid is null) return Unauthorized();

            var allowed = await _repo.PuedeAccederModuloAsync(uid.Value, "Inventario", "Leer");
            if (!allowed) return Forbid();

            var rows = await _repo.GetProductosMiniAsync();
            return Ok(rows);
        }
        [HttpGet("access")]
        public async Task<IActionResult> Access(
    [FromQuery] string module = "Inventario",
    [FromQuery] string action = "Leer")
        {
            var uid = GetUserId();
            if (uid is null) return Unauthorized();

            var ok = await _repo.PuedeAccederModuloAsync(uid.Value, module, action);
            return Ok(ok);
        }


    }
}
