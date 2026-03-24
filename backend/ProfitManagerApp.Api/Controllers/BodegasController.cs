using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Dto;
using ProfitManagerApp.Api.Infrastructure;
using ProfitManagerApp.Api.Models.Rows;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrador,Vendedor")]
    public class BodegasController : ControllerBase
    {
        private readonly AppDbContext _db;

        public BodegasController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<object>>> List(
            [FromQuery] string? search,
            [FromQuery] bool soloActivas = true,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 200) pageSize = 20;

            IQueryable<BodegaRow> q = _db.Bodegas.AsNoTracking();

            if (soloActivas)
                q = q.Where(x => x.IsActive);

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
                .Select(x => new
                {
                    x.BodegaID,
                    x.Codigo,
                    x.Nombre,
                    x.Direccion,
                    x.Contacto,
                    x.IsActive
                })
                .ToListAsync();

            return Ok(new PagedResult<object>(items, total, page, pageSize));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            if (id <= 0)
                return BadRequest(new { code = "INVALID_ID", message = "El identificador de la bodega no es válido." });

            var e = await _db.Bodegas
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.BodegaID == id);

            if (e is null)
                return NotFound(new { code = "BODEGA_NOT_FOUND", message = "Bodega no encontrada." });

            return Ok(new
            {
                e.BodegaID,
                e.Codigo,
                e.Nombre,
                e.Direccion,
                e.Contacto,
                e.IsActive
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BodegaCreateDto dto)
        {
            if (dto is null)
                return BadRequest(new { code = "BODY_REQUIRED", message = "El cuerpo de la solicitud es obligatorio." });

            dto.Codigo = string.IsNullOrWhiteSpace(dto.Codigo) ? null : dto.Codigo.Trim();
            dto.Nombre = dto.Nombre?.Trim() ?? string.Empty;
            dto.Direccion = string.IsNullOrWhiteSpace(dto.Direccion) ? null : dto.Direccion.Trim();
            dto.Contacto = string.IsNullOrWhiteSpace(dto.Contacto) ? null : dto.Contacto.Trim();

            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return BadRequest(new { code = "FIELD_REQUIRED:Nombre", message = "El nombre es obligatorio." });

            if (!string.IsNullOrWhiteSpace(dto.Codigo))
            {
                var codigoNormalizado = dto.Codigo.ToUpper();

                var dup = await _db.Bodegas
                    .AnyAsync(x => x.Codigo != null && x.Codigo.Trim().ToUpper() == codigoNormalizado);

                if (dup)
                    return Conflict(new { code = "CODIGO_DUPLICATE", message = "El código de bodega ya existe." });
            }

            var entity = new BodegaRow
            {
                Codigo = dto.Codigo,
                Nombre = dto.Nombre,
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
                entity.IsActive,
                message = "Bodega creada correctamente."
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] BodegaUpdateDto dto)
        {
            if (id <= 0)
                return BadRequest(new { code = "INVALID_ID", message = "El identificador de la bodega no es válido." });

            if (dto is null)
                return BadRequest(new { code = "BODY_REQUIRED", message = "El cuerpo de la solicitud es obligatorio." });

            var entity = await _db.Bodegas.FirstOrDefaultAsync(x => x.BodegaID == id);
            if (entity is null)
                return NotFound(new { code = "BODEGA_NOT_FOUND", message = "Bodega no encontrada." });

            dto.Codigo = string.IsNullOrWhiteSpace(dto.Codigo) ? null : dto.Codigo.Trim();
            dto.Nombre = dto.Nombre?.Trim() ?? string.Empty;
            dto.Direccion = string.IsNullOrWhiteSpace(dto.Direccion) ? null : dto.Direccion.Trim();
            dto.Contacto = string.IsNullOrWhiteSpace(dto.Contacto) ? null : dto.Contacto.Trim();

            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return BadRequest(new { code = "FIELD_REQUIRED:Nombre", message = "El nombre es obligatorio." });

            if (!string.IsNullOrWhiteSpace(dto.Codigo))
            {
                var codigoNormalizado = dto.Codigo.ToUpper();

                var dup = await _db.Bodegas
                    .AnyAsync(x => x.Codigo != null &&
                                   x.Codigo.Trim().ToUpper() == codigoNormalizado &&
                                   x.BodegaID != id);

                if (dup)
                    return Conflict(new { code = "CODIGO_DUPLICATE", message = "El código de bodega ya existe." });
            }

            if (dto.IsActive.HasValue && dto.IsActive.Value == false)
            {
                var tieneStock = await _db.Inventarios
                    .AsNoTracking()
                    .AnyAsync(x => x.BodegaID == id && x.Cantidad > 0);

                if (tieneStock)
                {
                    return Conflict(new
                    {
                        code = "BODEGA_CON_STOCK",
                        message = "No se puede inactivar la bodega porque tiene stock disponible."
                    });
                }
            }

            entity.Codigo = dto.Codigo;
            entity.Nombre = dto.Nombre;
            entity.Direccion = dto.Direccion;
            entity.Contacto = dto.Contacto;

            if (dto.IsActive.HasValue)
                entity.IsActive = dto.IsActive.Value;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                entity.BodegaID,
                entity.Codigo,
                entity.Nombre,
                entity.Direccion,
                entity.Contacto,
                entity.IsActive,
                message = "Bodega actualizada correctamente."
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Inactivar([FromRoute] int id)
        {
            if (id <= 0)
                return BadRequest(new { code = "INVALID_ID", message = "El identificador de la bodega no es válido." });

            var entity = await _db.Bodegas.FirstOrDefaultAsync(x => x.BodegaID == id);
            if (entity is null)
                return NotFound(new { code = "BODEGA_NOT_FOUND", message = "Bodega no encontrada." });

            if (!entity.IsActive)
                return Ok(new { message = "La bodega ya se encontraba inactiva." });

            var tieneStock = await _db.Inventarios
                .AsNoTracking()
                .AnyAsync(x => x.BodegaID == id && x.Cantidad > 0);

            if (tieneStock)
            {
                return Conflict(new
                {
                    code = "BODEGA_CON_STOCK",
                    message = "No se puede inactivar la bodega porque tiene stock disponible."
                });
            }

            entity.IsActive = false;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Bodega inactivada correctamente." });
        }

        [HttpPost("{id:int}/reactivar")]
        public async Task<IActionResult> Reactivar([FromRoute] int id)
        {
            if (id <= 0)
                return BadRequest(new { code = "INVALID_ID", message = "El identificador de la bodega no es válido." });

            var entity = await _db.Bodegas.FirstOrDefaultAsync(x => x.BodegaID == id);
            if (entity is null)
                return NotFound(new { code = "BODEGA_NOT_FOUND", message = "Bodega no encontrada." });

            if (entity.IsActive)
                return Ok(new { message = "La bodega ya se encontraba activa." });

            entity.IsActive = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Bodega reactivada correctamente." });
        }
    }

    public record PagedResult<T>(
        IReadOnlyList<T> Items,
        int Total,
        int Page,
        int PageSize);
}