using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Dto;
using ProfitManagerApp.Api.Infrastructure;
using ProfitManagerApp.Api.Models.Rows;

namespace ProfitManagerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UnidadesController : ControllerBase
{
    private readonly AppDbContext _db;
    public UnidadesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool soloActivas = true)
    {
        var q = _db.Unidades.AsNoTracking();
        if (soloActivas) q = q.Where(x => x.Activo);
        var items = await q.OrderBy(x => x.Nombre)
            .Select(u => new { u.UnidadID, u.Codigo, u.Nombre, u.Activo })
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id)
    {
        var u = await _db.Unidades.AsNoTracking().FirstOrDefaultAsync(x => x.UnidadID == id);
        return u is null ? NotFound() : Ok(new { u.UnidadID, u.Codigo, u.Nombre, u.Activo });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UnidadCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Codigo) || string.IsNullOrWhiteSpace(dto.Nombre))
            return Problem(title: "FIELDS_REQUIRED", detail: "Codigo y Nombre son obligatorios.", statusCode: 400);

        var dup = await _db.Unidades.AnyAsync(x => x.Codigo == dto.Codigo);
        if (dup) return Problem(title: "CODIGO_DUPLICATE", statusCode: 409);

        var e = new UnidadAlmacenamientoRow
        {
            Codigo = dto.Codigo.Trim(),
            Nombre = dto.Nombre.Trim(),
            Activo = dto.Activo
        };
        _db.Unidades.Add(e);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = e.UnidadID }, new { e.UnidadID, e.Codigo, e.Nombre, e.Activo });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update([FromRoute] int id, [FromBody] UnidadUpdateDto dto)
    {
        var e = await _db.Unidades.FirstOrDefaultAsync(x => x.UnidadID == id);
        if (e is null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Codigo) || string.IsNullOrWhiteSpace(dto.Nombre))
            return Problem(title: "FIELDS_REQUIRED", statusCode: 400);

        var dup = await _db.Unidades.AnyAsync(x => x.Codigo == dto.Codigo && x.UnidadID != id);
        if (dup) return Problem(title: "CODIGO_DUPLICATE", statusCode: 409);

        e.Codigo = dto.Codigo.Trim();
        e.Nombre = dto.Nombre.Trim();
        if (dto.Activo.HasValue) e.Activo = dto.Activo.Value;

        await _db.SaveChangesAsync();
        return Ok(new { e.UnidadID, e.Codigo, e.Nombre, e.Activo });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Inactivar([FromRoute] int id)
    {
        var e = await _db.Unidades.FirstOrDefaultAsync(x => x.UnidadID == id);
        if (e is null) return NotFound();
        if (!e.Activo) return NoContent();

        e.Activo = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
