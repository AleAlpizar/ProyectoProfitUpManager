using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Data.Abstractions;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Domain.Inventory.Dto;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
public class InventarioController : ControllerBase
{
  private readonly IInventarioRepository _repo;
  public InventarioController(IInventarioRepository repo) => _repo = repo;

  [HttpGet("cantidad")]
  public async Task<IActionResult> GetCantidad([FromQuery] int productoID, [FromQuery] int bodegaID)
  {
    var cant = await _repo.GetCantidadActualAsync(productoID, bodegaID);
    return Ok(new { cantidad = cant });
  }

  [HttpPost("cantidad/set")]
  public async Task<IActionResult> SetCantidad([FromBody] InventarioSetCantidadDto dto)
  {
    if (dto is null) return BadRequest(new { code = "BODY_REQUIRED" });
    if (dto.NuevaCantidad < 0) return Problem(title: "INVALID_QTY", statusCode: 400);

    int? userId = null;
    var idClaim = User?.FindFirstValue(ClaimTypes.NameIdentifier);
    if (int.TryParse(idClaim, out var idVal)) userId = idVal;

    await _repo.SetCantidadAbsolutaAsync(dto, userId);
    return NoContent();
  }

  [HttpPost("asignaciones")]
  [HttpPost("asignar")]
  [HttpPost("asignar-producto")]
  public async Task<IActionResult> Asignar([FromBody] AsignacionCreateDto dto)
  {
    if (dto is null) return BadRequest(new { code = "BODY_REQUIRED" });
    if (dto.ProductoID <= 0 || dto.BodegaID <= 0)
      return BadRequest(new { code = "INVALID_IDS" });

    if (!await _repo.ExisteProductoAsync(dto.ProductoID))
      return NotFound(new { code = "PRODUCTO_NOT_FOUND_OR_INACTIVE" });

    if (!await _repo.ExisteBodegaAsync(dto.BodegaID))
      return NotFound(new { code = "BODEGA_NOT_FOUND_OR_INACTIVE" });

    var ya = await _repo.ExisteAsignacionAsync(dto.ProductoID, dto.BodegaID);
    if (!ya)
      await _repo.AsignarProductoBodegaAsync(dto.ProductoID, dto.BodegaID);

    return NoContent();
  }

  [HttpGet("disponibilidad-por-productos")]
  // [Authorize]
  public async Task<IActionResult> DisponibilidadPorProductos(
    [FromQuery] DisponibilidadRequestDto dto,
    CancellationToken ct)
  {
    if (dto is null || dto.ProductoIds is null || dto.ProductoIds.Count == 0)
      return BadRequest(new { code = "PRODUCT_IDS_REQUIRED", msg="Se necesitan productos." });

    var dict = await _repo.GetBodegasConStockPorProductoAsync(dto.ProductoIds.Distinct(), ct);

    var payload = dto.ProductoIds
        .Distinct()
        .Where(id => id > 0)
        .Select(id => new ProductoDisponibilidadDto(
            id,
            dict.TryGetValue(id, out var bodegas) ? bodegas : new List<BodegaStockDto>()))
        .ToList();

    return Ok(payload);
  }
}
