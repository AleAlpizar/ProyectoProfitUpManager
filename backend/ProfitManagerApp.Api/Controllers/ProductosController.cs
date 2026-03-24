using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Data.Abstractions;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Domain.Inventory.Dto;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrador,Vendedor")]
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
            if (dto is null)
                return BadRequest(new { code = "BODY_REQUIRED", message = "El cuerpo de la solicitud es obligatorio." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            dto.Nombre = dto.Nombre?.Trim() ?? string.Empty;
            dto.SKU = string.IsNullOrWhiteSpace(dto.SKU) ? null : dto.SKU.Trim();
            dto.Descripcion = string.IsNullOrWhiteSpace(dto.Descripcion) ? null : dto.Descripcion.Trim();
            dto.CodigoInterno = string.IsNullOrWhiteSpace(dto.CodigoInterno) ? null : dto.CodigoInterno.Trim();

            if (dto.StockInicial.GetValueOrDefault() > 0 && !dto.BodegaID.HasValue)
            {
                return BadRequest(new
                {
                    code = "BODEGA_REQUIRED_FOR_INITIAL_STOCK",
                    message = "Debes indicar una bodega cuando envías stock inicial."
                });
            }

            if (dto.PrecioCosto.HasValue && dto.PrecioCosto.Value < 0)
                return BadRequest(new { code = "FIELD_INVALID:PrecioCosto", message = "El precio de costo debe ser mayor o igual a 0." });

            if (dto.Peso.HasValue && dto.Peso.Value < 0)
                return BadRequest(new { code = "FIELD_INVALID:Peso", message = "El peso debe ser mayor o igual a 0." });

            if (dto.Largo.HasValue && dto.Largo.Value < 0)
                return BadRequest(new { code = "FIELD_INVALID:Largo", message = "El largo debe ser mayor o igual a 0." });

            if (dto.Alto.HasValue && dto.Alto.Value < 0)
                return BadRequest(new { code = "FIELD_INVALID:Alto", message = "El alto debe ser mayor o igual a 0." });

            if (dto.Ancho.HasValue && dto.Ancho.Value < 0)
                return BadRequest(new { code = "FIELD_INVALID:Ancho", message = "El ancho debe ser mayor o igual a 0." });

            if (dto.BodegaID.HasValue && !await _inventarioRepository.ExisteBodegaAsync(dto.BodegaID.Value))
            {
                return NotFound(new
                {
                    code = "BODEGA_NOT_FOUND_OR_INACTIVE",
                    message = "La bodega indicada no existe o está inactiva."
                });
            }

            int? userId = null;
            var idClaim = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(idClaim, out var idVal)) userId = idVal;

            try
            {
                var productoId = await _inventarioRepository.CrearProductoAsync(dto, userId);

                if (dto.BodegaID.HasValue && dto.StockInicial.GetValueOrDefault(0) > 0)
                {
                    var ajuste = new AjusteInventarioDto
                    {
                        ProductoID = productoId,
                        BodegaID = dto.BodegaID.Value,
                        TipoMovimiento = "Entrada",
                        Cantidad = dto.StockInicial.Value,
                        Motivo = "Stock inicial (alta de producto)"
                    };

                    await _inventarioRepository.AjusteAsync(ajuste, userId);
                }

                return Created($"/api/productos/{productoId}", new
                {
                    productoId,
                    message = "Producto creado correctamente."
                });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("SKU_DUPLICATE", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { code = "SKU_DUPLICATE", message = "El SKU ya existe." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("FIELD_REQUIRED:Nombre", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { code = "FIELD_REQUIRED:Nombre", message = "El nombre es obligatorio." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("FIELD_INVALID:PrecioVenta", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { code = "FIELD_INVALID:PrecioVenta", message = "El precio de venta debe ser mayor o igual a 0." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("FIELD_INVALID:PrecioCosto", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { code = "FIELD_INVALID:PrecioCosto", message = "El precio de costo debe ser mayor o igual a 0." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("FIELD_INVALID:Descuento", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { code = "FIELD_INVALID:Descuento", message = "El descuento debe estar entre 0 y 100." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("UNIDAD_NOT_FOUND_OR_INACTIVE", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { code = "UNIDAD_NOT_FOUND_OR_INACTIVE", message = "La unidad de almacenamiento no existe o está inactiva." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("BODEGA_NOT_FOUND_OR_INACTIVE", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { code = "BODEGA_NOT_FOUND_OR_INACTIVE", message = "La bodega indicada no existe o está inactiva." });
            }
        }

        [HttpGet("detalle/{id:int}")]
        public async Task<IActionResult> GetDetalle([FromRoute] int id)
        {
            if (id <= 0)
                return BadRequest(new { code = "INVALID_ID", message = "El identificador del producto no es válido." });

            var detalle = await _inventarioRepository.GetProductoDetalleAsync(id);
            if (detalle is null)
                return NotFound(new { code = "PRODUCTO_NOT_FOUND", message = "Producto no encontrado." });

            return Ok(detalle);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] ProductoUpdateDto dto)
        {
            if (id <= 0)
                return BadRequest(new { code = "INVALID_ID", message = "El identificador del producto no es válido." });

            if (dto is null)
                return BadRequest(new { code = "BODY_REQUIRED", message = "El cuerpo de la solicitud es obligatorio." });

            dto.Nombre = dto.Nombre?.Trim() ?? string.Empty;
            dto.SKU = string.IsNullOrWhiteSpace(dto.SKU) ? null : dto.SKU.Trim();
            dto.Descripcion = string.IsNullOrWhiteSpace(dto.Descripcion) ? null : dto.Descripcion.Trim();
            dto.CodigoInterno = string.IsNullOrWhiteSpace(dto.CodigoInterno) ? null : dto.CodigoInterno.Trim();

            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return BadRequest(new { code = "FIELD_REQUIRED:Nombre", message = "El nombre es obligatorio." });

            if (dto.PrecioVenta.HasValue && dto.PrecioVenta.Value < 0)
                return BadRequest(new { code = "FIELD_INVALID:PrecioVenta", message = "El precio de venta debe ser mayor o igual a 0." });

            if (dto.PrecioCosto.HasValue && dto.PrecioCosto.Value < 0)
                return BadRequest(new { code = "FIELD_INVALID:PrecioCosto", message = "El precio de costo debe ser mayor o igual a 0." });

            if (dto.Descuento.HasValue && (dto.Descuento.Value < 0 || dto.Descuento.Value > 100))
                return BadRequest(new { code = "FIELD_INVALID:Descuento", message = "El descuento debe estar entre 0 y 100." });

            if (dto.Peso.HasValue && dto.Peso.Value < 0)
                return BadRequest(new { code = "FIELD_INVALID:Peso", message = "El peso debe ser mayor o igual a 0." });

            if (dto.Largo.HasValue && dto.Largo.Value < 0)
                return BadRequest(new { code = "FIELD_INVALID:Largo", message = "El largo debe ser mayor o igual a 0." });

            if (dto.Alto.HasValue && dto.Alto.Value < 0)
                return BadRequest(new { code = "FIELD_INVALID:Alto", message = "El alto debe ser mayor o igual a 0." });

            if (dto.Ancho.HasValue && dto.Ancho.Value < 0)
                return BadRequest(new { code = "FIELD_INVALID:Ancho", message = "El ancho debe ser mayor o igual a 0." });

            try
            {
                await _inventarioRepository.UpdateProductoAsync(id, dto);
                return Ok(new { message = "Producto actualizado correctamente." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("SKU_DUPLICATE", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { code = "SKU_DUPLICATE", message = "El SKU ya existe." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("UNIDAD_NOT_FOUND_OR_INACTIVE", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { code = "UNIDAD_NOT_FOUND_OR_INACTIVE", message = "La unidad de almacenamiento no existe o está inactiva." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { code = "PRODUCTO_NOT_FOUND", message = "Producto no encontrado." });
            }
        }

        [HttpPost("{id:int}/inactivar")]
        public async Task<IActionResult> Inactivar([FromRoute] int id)
        {
            if (id <= 0)
                return BadRequest(new { code = "INVALID_ID", message = "El identificador del producto no es válido." });

            if (!await _inventarioRepository.ExisteProductoAsync(id))
            {
                return NotFound(new
                {
                    code = "PRODUCTO_NOT_FOUND_OR_INACTIVE",
                    message = "Producto no encontrado o ya inactivo."
                });
            }

            int? userId = null;
            var idClaim = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(idClaim, out var idVal)) userId = idVal;

            try
            {
                await _inventarioRepository.InactivarProductoYRetirarStockAsync(id, userId);
                return Ok(new { message = "Producto inactivado y stock retirado correctamente." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { code = "PRODUCTO_NOT_FOUND", message = "Producto no encontrado." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("PRODUCTO_NOT_FOUND_OR_INACTIVE", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { code = "PRODUCTO_NOT_FOUND_OR_INACTIVE", message = "El producto ya se encuentra inactivo." });
            }
            catch (Exception ex)
            {
                return Problem(title: "ERROR_INACTIVAR_PRODUCTO", detail: ex.Message, statusCode: 500);
            }
        }

        [HttpPost("{id:int}/activar")]
        public async Task<IActionResult> Activar([FromRoute] int id)
        {
            if (id <= 0)
                return BadRequest(new { code = "INVALID_ID", message = "El identificador del producto no es válido." });

            try
            {
                await _inventarioRepository.ActivarProductoAsync(id);
                return Ok(new { message = "Producto activado correctamente." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { code = "PRODUCTO_NOT_FOUND", message = "Producto no encontrado." });
            }
        }

        [HttpGet("mini")]
        public async Task<IActionResult> Mini([FromQuery] string estado = "activos")
        {
            var items = await _inventarioRepository.GetProductosMiniAsync(estado);
            return Ok(items);
        }
    }
}