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
    public class InventarioController : ControllerBase
    {
        private readonly IInventarioRepository _repo;

        public InventarioController(IInventarioRepository repo)
        {
            _repo = repo;
        }

        [HttpGet("cantidad")]
        public async Task<IActionResult> GetCantidad([FromQuery] int productoID, [FromQuery] int bodegaID)
        {
            if (productoID <= 0 || bodegaID <= 0)
            {
                return BadRequest(new
                {
                    code = "INVALID_IDS",
                    message = "ProductoID y BodegaID deben ser mayores que cero."
                });
            }

            var cant = await _repo.GetCantidadActualAsync(productoID, bodegaID);
            return Ok(new { cantidad = cant });
        }

        [HttpPost("cantidad/set")]
        public async Task<IActionResult> SetCantidad([FromBody] InventarioSetCantidadDto dto)
        {
            if (dto is null)
                return BadRequest(new { code = "BODY_REQUIRED", message = "El cuerpo de la solicitud es obligatorio." });

            if (dto.ProductoID <= 0 || dto.BodegaID <= 0)
                return BadRequest(new { code = "INVALID_IDS", message = "ProductoID y BodegaID deben ser mayores que cero." });

            if (dto.NuevaCantidad < 0)
                return BadRequest(new { code = "INVALID_QTY", message = "La nueva cantidad no puede ser negativa." });

            int? userId = null;
            var idClaim = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(idClaim, out var idVal)) userId = idVal;

            try
            {
                await _repo.SetCantidadAbsolutaAsync(dto, userId);
                return Ok(new { message = "Cantidad actualizada correctamente." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("PRODUCTO_NOT_FOUND_OR_INACTIVE", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { code = "PRODUCTO_NOT_FOUND_OR_INACTIVE", message = "El producto no existe o está inactivo." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("BODEGA_NOT_FOUND_OR_INACTIVE", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { code = "BODEGA_NOT_FOUND_OR_INACTIVE", message = "La bodega no existe o está inactiva." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("STOCK_INSUFICIENTE", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { code = "STOCK_INSUFICIENTE", message = "No hay stock suficiente para establecer esa cantidad." });
            }
        }

        [HttpPost("asignaciones")]
        [HttpPost("asignar")]
        [HttpPost("asignar-producto")]
        public async Task<IActionResult> Asignar([FromBody] AsignacionCreateDto dto)
        {
            if (dto is null)
                return BadRequest(new { code = "BODY_REQUIRED", message = "El cuerpo de la solicitud es obligatorio." });

            if (dto.ProductoID <= 0 || dto.BodegaID <= 0)
                return BadRequest(new { code = "INVALID_IDS", message = "ProductoID y BodegaID deben ser mayores que cero." });

            if (!await _repo.ExisteProductoAsync(dto.ProductoID))
                return NotFound(new { code = "PRODUCTO_NOT_FOUND_OR_INACTIVE", message = "El producto no existe o está inactivo." });

            if (!await _repo.ExisteBodegaAsync(dto.BodegaID))
                return NotFound(new { code = "BODEGA_NOT_FOUND_OR_INACTIVE", message = "La bodega no existe o está inactiva." });

            var ya = await _repo.ExisteAsignacionAsync(dto.ProductoID, dto.BodegaID);
            if (!ya)
                await _repo.AsignarProductoBodegaAsync(dto.ProductoID, dto.BodegaID);

            return Ok(new { message = ya ? "La asignación ya existía." : "Producto asignado a la bodega correctamente." });
        }

        [HttpGet("stock")]
        public async Task<IActionResult> Stock([FromQuery] int? bodegaId, [FromQuery] int? productoId, CancellationToken ct)
        {
            if (bodegaId.HasValue && bodegaId.Value <= 0)
                return BadRequest(new { code = "INVALID_BODEGA_ID", message = "El BodegaID no es válido." });

            if (productoId.HasValue && productoId.Value <= 0)
                return BadRequest(new { code = "INVALID_PRODUCTO_ID", message = "El ProductoID no es válido." });

            var items = await _repo.GetStockAsync(new StockQueryDto
            {
                BodegaID = bodegaId,
                ProductoID = productoId
            }, ct);

            return Ok(items);
        }

        [HttpPost("ajuste/entrada")]
        public async Task<IActionResult> AjusteEntrada([FromBody] AjusteInventarioDto dto)
        {
            if (dto is null)
                return BadRequest(new { code = "BODY_REQUIRED", message = "El cuerpo de la solicitud es obligatorio." });

            if (dto.ProductoID <= 0 || dto.BodegaID <= 0)
                return BadRequest(new { code = "INVALID_IDS", message = "ProductoID y BodegaID deben ser mayores que cero." });

            if (dto.Cantidad <= 0)
                return BadRequest(new { code = "INVALID_QTY", message = "La cantidad debe ser mayor que cero." });

            dto.TipoMovimiento = "Entrada";
            dto.Motivo = string.IsNullOrWhiteSpace(dto.Motivo) ? null : dto.Motivo.Trim();

            if (!await _repo.ExisteProductoAsync(dto.ProductoID))
                return NotFound(new { code = "PRODUCTO_NOT_FOUND_OR_INACTIVE", message = "El producto no existe o está inactivo." });

            if (!await _repo.ExisteBodegaAsync(dto.BodegaID))
                return NotFound(new { code = "BODEGA_NOT_FOUND_OR_INACTIVE", message = "La bodega no existe o está inactiva." });

            var asignado = await _repo.ExisteAsignacionAsync(dto.ProductoID, dto.BodegaID);
            if (!asignado)
            {
                return Conflict(new
                {
                    code = "ASIGNACION_REQUERIDA",
                    message = "El producto debe estar asignado previamente a la bodega."
                });
            }

            int? userId = null;
            var idClaim = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(idClaim, out var idVal)) userId = idVal;

            try
            {
                await _repo.AjusteAsync(dto, userId);
                return Ok(new { message = "Entrada de inventario registrada correctamente." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("TIPO_MOVIMIENTO_INVALIDO", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { code = "TIPO_MOVIMIENTO_INVALIDO", message = "El tipo de movimiento indicado no es válido." });
            }
        }

        [HttpPost("ajuste/salida-manual")]
        public async Task<IActionResult> AjusteSalidaManual([FromBody] AjusteInventarioDto dto)
        {
            if (dto is null)
                return BadRequest(new { code = "BODY_REQUIRED", message = "El cuerpo de la solicitud es obligatorio." });

            if (dto.ProductoID <= 0 || dto.BodegaID <= 0)
                return BadRequest(new { code = "INVALID_IDS", message = "ProductoID y BodegaID deben ser mayores que cero." });

            if (dto.Cantidad <= 0)
                return BadRequest(new { code = "INVALID_QTY", message = "La cantidad debe ser mayor que cero." });

            if (string.IsNullOrWhiteSpace(dto.Motivo))
            {
                return BadRequest(new
                {
                    code = "MOTIVO_REQUIRED",
                    message = "Debe indicar un motivo para el ajuste de salida."
                });
            }

            dto.TipoMovimiento = "AjusteSalidaManual";
            dto.Motivo = dto.Motivo.Trim();

            if (!await _repo.ExisteProductoAsync(dto.ProductoID))
                return NotFound(new { code = "PRODUCTO_NOT_FOUND_OR_INACTIVE", message = "El producto no existe o está inactivo." });

            if (!await _repo.ExisteBodegaAsync(dto.BodegaID))
                return NotFound(new { code = "BODEGA_NOT_FOUND_OR_INACTIVE", message = "La bodega no existe o está inactiva." });

            var asignado = await _repo.ExisteAsignacionAsync(dto.ProductoID, dto.BodegaID);
            if (!asignado)
            {
                return Conflict(new
                {
                    code = "ASIGNACION_REQUERIDA",
                    message = "El producto debe estar asignado previamente a la bodega."
                });
            }

            int? userId = null;
            var idClaim = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(idClaim, out var idVal)) userId = idVal;

            try
            {
                await _repo.AjusteAsync(dto, userId);
                return Ok(new { message = "Salida manual de inventario registrada correctamente." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("STOCK_INSUFICIENTE", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { code = "STOCK_INSUFICIENTE", message = "No hay stock suficiente para realizar el ajuste." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("TIPO_MOVIMIENTO_INVALIDO", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { code = "TIPO_MOVIMIENTO_INVALIDO", message = "El tipo de movimiento indicado no es válido." });
            }
        }

        [HttpGet("disponibilidad-por-productos")]
        public async Task<IActionResult> DisponibilidadPorProductos([FromQuery] DisponibilidadRequestDto dto, CancellationToken ct)
        {
            if (dto is null || dto.ProductoIds is null || dto.ProductoIds.Count == 0)
            {
                return BadRequest(new
                {
                    code = "PRODUCT_IDS_REQUIRED",
                    message = "Se necesita al menos un producto."
                });
            }

            var ids = dto.ProductoIds.Where(x => x > 0).Distinct().ToList();
            if (ids.Count == 0)
            {
                return BadRequest(new
                {
                    code = "PRODUCT_IDS_REQUIRED",
                    message = "Los ids de producto deben ser mayores que cero."
                });
            }

            var dict = await _repo.GetBodegasConStockPorProductoAsync(ids, ct);

            var payload = ids
                .Select(id => new ProductoDisponibilidadDto(
                    id,
                    dict.TryGetValue(id, out var bodegas) ? bodegas : new List<BodegaStockDto>()))
                .ToList();

            return Ok(payload);
        }

        [HttpGet("historial")]
        public async Task<IActionResult> Historial(
            [FromQuery] int? productoId,
            [FromQuery] int? bodegaId,
            [FromQuery] string? tipoMovimiento,
            [FromQuery] int? usuarioId,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken ct = default)
        {
            if (productoId.HasValue && productoId.Value <= 0)
                return BadRequest(new { code = "INVALID_PRODUCTO_ID", message = "El ProductoID no es válido." });

            if (bodegaId.HasValue && bodegaId.Value <= 0)
                return BadRequest(new { code = "INVALID_BODEGA_ID", message = "El BodegaID no es válido." });

            if (usuarioId.HasValue && usuarioId.Value <= 0)
                return BadRequest(new { code = "INVALID_USUARIO_ID", message = "El UsuarioID no es válido." });

            if (desde.HasValue && hasta.HasValue && desde > hasta)
            {
                return BadRequest(new
                {
                    code = "RANGO_FECHAS_INVALIDO",
                    message = "La fecha inicial no puede ser mayor que la fecha final."
                });
            }

            var query = new InventarioHistorialQueryDto
            {
                ProductoID = productoId,
                BodegaID = bodegaId,
                TipoMovimiento = string.IsNullOrWhiteSpace(tipoMovimiento) ? null : tipoMovimiento.Trim(),
                UsuarioID = usuarioId,
                Desde = desde,
                Hasta = hasta,
                Page = page <= 0 ? 1 : page,
                PageSize = pageSize <= 0 ? 50 : pageSize
            };

            var (items, total) = await _repo.GetHistorialAsync(query, ct);

            return Ok(new
            {
                items,
                total,
                page = query.Page,
                pageSize = query.PageSize
            });
        }
    }
}