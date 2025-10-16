using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Domain.Inventory.Dto;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly IInventarioRepository _inventarioRepository;

        public ProductosController(IInventarioRepository inventarioRepository)
        {
            _inventarioRepository = inventarioRepository;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProductoCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int? userId = null;
            var idClaim = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(idClaim, out var idVal)) userId = idVal;

            try
            {
                var productoId = await _inventarioRepository.CrearProductoAsync(dto, userId);

                var tieneBodega = dto.BodegaID.HasValue;
                var stockIni = dto.StockInicial.GetValueOrDefault(0m);

                if (tieneBodega && stockIni > 0m)
                {
                    var ajuste = new AjusteInventarioDto
                    {
                        ProductoID = productoId,
                        BodegaID = dto.BodegaID!.Value,
                        TipoMovimiento = "Entrada",
                        Cantidad = stockIni,
                        Motivo = "Stock inicial (alta de producto)"
                    };

                    await _inventarioRepository.AjusteAsync(ajuste, userId);
                }

                return Created($"/api/productos/{productoId}", new { productoId });
            }
            catch (SqlException ex) when (ex.Message.Contains("SKU_DUPLICATE"))
            {
                return Conflict(new { error = "El SKU ya existe." });
            }
            catch (SqlException ex) when (ex.Message.Contains("FIELD_REQUIRED:Nombre"))
            {
                return BadRequest(new { error = "El nombre es obligatorio." });
            }
            catch (SqlException ex) when (ex.Message.Contains("FIELD_REQUIRED:PrecioVenta"))
            {
                return BadRequest(new { error = "El precio de venta es obligatorio." });
            }
        }

        [HttpGet("detalle/{id:int}")]
        public async Task<IActionResult> GetDetalle([FromRoute] int id)
        {
            var detalle = await _inventarioRepository.GetProductoDetalleAsync(id);
            if (detalle is null) return NotFound("Not Found");
            return Ok(detalle);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] ProductoUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return Problem(title: "FIELD_REQUIRED:Nombre", statusCode: 400);

            try
            {
                await _inventarioRepository.UpdateProductoAsync(id, dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("no encontrado", StringComparison.OrdinalIgnoreCase))
                    return NotFound("Not Found");

                return Problem(ex.Message);
            }
        }
    }
}
