using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Data.Abstractions;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Models.Rows;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/proveedores")]
    [Authorize(Roles = "Administrador,Vendedor")]
    public sealed class ProveedoresController : ControllerBase
    {
        private readonly IProveedorRepository _proveedorRepository;

        public ProveedoresController(IProveedorRepository proveedorRepository)
        {
            _proveedorRepository = proveedorRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProveedorDto>>> GetAll(
            [FromQuery] bool includeInactive = false,
            CancellationToken cancellationToken = default)
        {
            var rows = await _proveedorRepository.ListAsync(includeInactive, cancellationToken);
            var dtos = rows.Select(ToDto).ToList();
            return Ok(dtos);
        }

        [HttpGet("mini")]
        public async Task<ActionResult<IEnumerable<ProveedorMiniDto>>> GetMini(
            CancellationToken cancellationToken = default)
        {
            var rows = await _proveedorRepository.GetActivosAsync(cancellationToken);
            var dtos = rows.Select(ToMiniDto).ToList();
            return Ok(dtos);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProveedorDto>> GetById(
            [FromRoute] int id,
            CancellationToken cancellationToken = default)
        {
            var row = await _proveedorRepository.GetByIdAsync(id, cancellationToken);
            if (row is null)
                return NotFound(new { message = "Proveedor no encontrado." });

            return Ok(ToDto(row));
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<ProveedorDto>> Create(
            [FromBody] ProveedorCreateInput input,
            CancellationToken cancellationToken = default)
        {
            if (input == null)
                return BadRequest(new { message = "Datos requeridos." });

            if (string.IsNullOrWhiteSpace(input.Nombre))
                return BadRequest(new { message = "El nombre es obligatorio." });

            var newId = await _proveedorRepository.CreateAsync(input, cancellationToken);
            var created = await _proveedorRepository.GetByIdAsync(newId, cancellationToken);

            if (created is null)
                return StatusCode(500, new { message = "No se pudo recuperar el proveedor creado." });

            var dto = ToDto(created);

            return CreatedAtAction(nameof(GetById), new { id = dto.ProveedorID }, dto);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<ProveedorDto>> Update(
            [FromRoute] int id,
            [FromBody] ProveedorUpdateInput input,
            CancellationToken cancellationToken = default)
        {
            if (input == null)
                return BadRequest(new { message = "Datos requeridos." });

            if (input.Nombre != null && string.IsNullOrWhiteSpace(input.Nombre))
                return BadRequest(new { message = "El nombre no puede estar vacío." });

            var updated = await _proveedorRepository.UpdateAsync(id, input, cancellationToken);
            if (!updated)
            {
                var exists = await _proveedorRepository.GetByIdAsync(id, cancellationToken);
                if (exists is null)
                    return NotFound(new { message = "Proveedor no encontrado." });
            }

            var row = await _proveedorRepository.GetByIdAsync(id, cancellationToken);
            if (row is null)
                return NotFound(new { message = "Proveedor no encontrado después de actualizar." });

            return Ok(ToDto(row));
        }

        [HttpPatch("{id:int}/status/{isActive:bool}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> SetStatus(
            [FromRoute] int id,
            [FromRoute] bool isActive,
            CancellationToken cancellationToken = default)
        {
            var ok = await _proveedorRepository.SetIsActiveAsync(id, isActive, cancellationToken);
            if (!ok)
                return NotFound(new { message = "Proveedor no encontrado." });

            return NoContent();
        }


        private static ProveedorDto ToDto(ProveedorRow r) => new()
        {
            ProveedorID = r.ProveedorID,
            Nombre = r.Nombre,
            Contacto = r.Contacto,
            Telefono = r.Telefono,
            Correo = r.Correo,
            Direccion = r.Direccion,
            IsActive = r.IsActive
        };

        private static ProveedorMiniDto ToMiniDto(ProveedorMiniRow r) => new()
        {
            ProveedorID = r.ProveedorID,
            Nombre = r.Nombre,
            Contacto = r.Contacto,
            Telefono = r.Telefono,
            Correo = r.Correo
        };
    }
}
