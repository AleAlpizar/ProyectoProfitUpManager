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
    public class ProductosController : ControllerBase
    {
        private readonly IInventarioRepository _repo;
        public ProductosController(IInventarioRepository repo) => _repo = repo;

        private int? GetUserId()
        {
            var v =
                User.FindFirstValue("uid") ??
                User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return int.TryParse(v, out var id) ? id : (int?)null;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] ProductoCreateDto dto)
        {
            var uid = GetUserId();
            if (uid is null) return Unauthorized();

            var allowed = await _repo.PuedeAccederModuloAsync(uid.Value, "Inventario", "Escribir");
            if (!allowed) return Forbid();

            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return BadRequest(new { error = "El nombre es obligatorio." });

            if (dto.PrecioVenta <= 0)
                return BadRequest(new { error = "El precio de venta debe ser mayor a 0." });

            if (dto.BodegaId <= 0)
                return BadRequest(new { error = "BODEGA_REQUERIDA", detalle = "Debe seleccionar una bodega válida." });

            if (!await _repo.BodegaExistsAsync(dto.BodegaId))
                return BadRequest(new { error = "BODEGA_INVALIDA", detalle = "La bodega seleccionada no existe o está inactiva." });

            try
            {
                var id = await _repo.CrearProductoAsync(dto, uid);
                return CreatedAtAction(nameof(Crear), new { id }, new { productoId = id, message = "Producto registrado" });
            }
            catch (ApplicationException ex) when (ex.Message == "BODEGA_INVALIDA")
            {
                return BadRequest(new { error = "BODEGA_INVALIDA", detalle = "La bodega seleccionada no existe o está inactiva." });
            }
            catch (ApplicationException ex) when (ex.Message == "SKU_DUPLICATE")
            {
                return BadRequest(new { error = "El SKU ya existe" });
            }
            catch (Exception ex) when (ex.Message.StartsWith("FIELD_REQUIRED"))
            {
                var campo = ex.Message.Split(':').LastOrDefault() ?? "Desconocido";
                return BadRequest(new { error = "Campos obligatorios faltantes", campo });
            }
        }
    }
}
