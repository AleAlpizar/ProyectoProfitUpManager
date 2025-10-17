using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Dto;
using ProfitManagerApp.Api.Infrastructure;
using ProfitManagerApp.Api.Models;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BodegasController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public BodegasController(AppDbContext db, IMapper mapper)
        {
            _db = db; _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<object>>> List(
            [FromQuery] string? search, [FromQuery] bool soloActivas = true,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 200) pageSize = 20;

            var q = _db.Bodegas.AsNoTracking();
            if (soloActivas) q = q.Where(x => x.IsActive);
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                q = q.Where(x =>
                    (x.Codigo != null && x.Codigo.Contains(s)) ||
                    x.Nombre.Contains(s) ||
                    (x.Direccion != null && x.Direccion.Contains(s)) ||
                    (x.Contacto != null && x.Contacto.Contains(s)));
            }

            var total = await q.CountAsync();
            var items = await q
                .OrderBy(x => x.Nombre)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new { x.BodegaID, x.Codigo, x.Nombre, x.Direccion, x.Contacto, x.IsActive })
                .ToListAsync();

            return Ok(new PagedResult<object>(items, total, page, pageSize));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var e = await _db.Bodegas.AsNoTracking().FirstOrDefaultAsync(x => x.BodegaID == id);
            if (e is null) return NotFound();
            return Ok(new { e.BodegaID, e.Codigo, e.Nombre, e.Direccion, e.Contacto, e.IsActive });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BodegaCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return Problem(title: "FIELD_REQUIRED:Nombre", statusCode: 400);

            if (!string.IsNullOrWhiteSpace(dto.Codigo))
            {
                var dup = await _db.Bodegas.AnyAsync(x => x.Codigo == dto.Codigo);
                if (dup) return Problem(title: "CODIGO_DUPLICATE", statusCode: 409);
            }

            var entity = new Bodega
            {
                Codigo = dto.Codigo?.Trim(),
                Nombre = dto.Nombre.Trim(),
                Direccion = dto.Direccion,
                Contacto = dto.Contacto,
                IsActive = true
            };

            _db.Bodegas.Add(entity);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = entity.BodegaID }, new
            {
                entity.BodegaID,
                entity.Codigo,
                entity.Nombre,
                entity.Direccion,
                entity.Contacto,
                entity.IsActive
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] BodegaUpdateDto dto)
        {
            var entity = await _db.Bodegas.FirstOrDefaultAsync(x => x.BodegaID == id);
            if (entity is null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return Problem(title: "FIELD_REQUIRED:Nombre", statusCode: 400);

            if (!string.IsNullOrWhiteSpace(dto.Codigo))
            {
                var dup = await _db.Bodegas.AnyAsync(x => x.Codigo == dto.Codigo && x.BodegaID != id);
                if (dup) return Problem(title: "CODIGO_DUPLICATE", statusCode: 409);
                entity.Codigo = dto.Codigo.Trim();
            }

            entity.Nombre = dto.Nombre.Trim();
            entity.Direccion = dto.Direccion;
            entity.Contacto = dto.Contacto;
            if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;

            await _db.SaveChangesAsync();

            return Ok(new { entity.BodegaID, entity.Codigo, entity.Nombre, entity.Direccion, entity.Contacto, entity.IsActive });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Inactivar([FromRoute] int id)
        {
            var entity = await _db.Bodegas.FirstOrDefaultAsync(x => x.BodegaID == id);
            if (entity is null) return NotFound();
            if (!entity.IsActive) return NoContent();

            entity.IsActive = false;
            await _db.SaveChangesAsync();
            return NoContent();
        }
        [HttpPost("{id:int}/reactivar")]
        public async Task<IActionResult> Reactivar([FromRoute] int id)
        {
            var entity = await _db.Bodegas.FirstOrDefaultAsync(x => x.BodegaID == id);
            if (entity is null) return NotFound();
            if (entity.IsActive) return NoContent();   
            entity.IsActive = true;
            await _db.SaveChangesAsync();
            return NoContent();
        }

    }

    public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);
}
