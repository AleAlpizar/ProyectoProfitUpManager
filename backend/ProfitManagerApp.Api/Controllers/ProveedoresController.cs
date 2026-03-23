using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.RegularExpressions;
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
        private static readonly EmailAddressAttribute EmailValidator = new();
        private static readonly Regex MultiSpaceRegex = new(@"\s{2,}", RegexOptions.Compiled);
        private static readonly Regex ProviderNameRegex = new(
            @"^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9&.\-_'()/#,\s]+$",
            RegexOptions.Compiled);

        private static readonly Regex ContactNameRegex = new(
            @"^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ.\-'\s]+$",
            RegexOptions.Compiled);

        private static readonly Regex PhoneRegex = new(
            @"^\+?[0-9]{8,15}$",
            RegexOptions.Compiled);

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
            if (id <= 0)
                return BadRequest(new { message = "El identificador del proveedor es inválido." });

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

            var normalized = NormalizeCreateInput(input);
            var validationError = ValidateCreate(normalized);
            if (validationError is not null)
                return BadRequest(new { message = validationError });

            var newId = await _proveedorRepository.CreateAsync(normalized, cancellationToken);
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
            if (id <= 0)
                return BadRequest(new { message = "El identificador del proveedor es inválido." });

            if (input == null)
                return BadRequest(new { message = "Datos requeridos." });

            var existing = await _proveedorRepository.GetByIdAsync(id, cancellationToken);
            if (existing is null)
                return NotFound(new { message = "Proveedor no encontrado." });

            var normalized = NormalizeUpdateInput(input, existing);
            var validationError = ValidateUpdate(normalized);
            if (validationError is not null)
                return BadRequest(new { message = validationError });

            var updated = await _proveedorRepository.UpdateAsync(id, normalized, cancellationToken);
            if (!updated)
                return StatusCode(500, new { message = "No se pudo actualizar el proveedor." });

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
            if (id <= 0)
                return BadRequest(new { message = "El identificador del proveedor es inválido." });

            var ok = await _proveedorRepository.SetIsActiveAsync(id, isActive, cancellationToken);
            if (!ok)
                return NotFound(new { message = "Proveedor no encontrado." });

            return NoContent();
        }

        private static ProveedorCreateInput NormalizeCreateInput(ProveedorCreateInput input) => new()
        {
            Nombre = NormalizeRequiredText(input.Nombre),
            Contacto = NormalizeOptionalText(input.Contacto),
            Telefono = NormalizePhone(input.Telefono),
            Correo = NormalizeEmail(input.Correo),
            Direccion = NormalizeOptionalText(input.Direccion)
        };

        private static ProveedorUpdateInput NormalizeUpdateInput(
            ProveedorUpdateInput input,
            ProveedorRow existing) => new()
            {
                Nombre = input.Nombre is not null
                ? NormalizeRequiredText(input.Nombre)
                : NormalizeRequiredText(existing.Nombre),

                Contacto = input.Contacto is not null
                ? NormalizeOptionalText(input.Contacto)
                : NormalizeOptionalText(existing.Contacto),

                Telefono = input.Telefono is not null
                ? NormalizePhone(input.Telefono)
                : NormalizePhone(existing.Telefono),

                Correo = input.Correo is not null
                ? NormalizeEmail(input.Correo)
                : NormalizeEmail(existing.Correo),

                Direccion = input.Direccion is not null
                ? NormalizeOptionalText(input.Direccion)
                : NormalizeOptionalText(existing.Direccion),

                IsActive = input.IsActive
            };

        private static string? ValidateCreate(ProveedorCreateInput input)
        {
            if (string.IsNullOrWhiteSpace(input.Nombre))
                return "El nombre es obligatorio.";

            return ValidateCommon(input.Nombre, input.Contacto, input.Telefono, input.Correo, input.Direccion);
        }

        private static string? ValidateUpdate(ProveedorUpdateInput input)
        {
            if (string.IsNullOrWhiteSpace(input.Nombre))
                return "El nombre es obligatorio.";

            return ValidateCommon(input.Nombre, input.Contacto, input.Telefono, input.Correo, input.Direccion);
        }

        private static string? ValidateCommon(
            string nombre,
            string? contacto,
            string? telefono,
            string? correo,
            string? direccion)
        {
            if (nombre.Length < 2 || nombre.Length > 150)
                return "El nombre debe tener entre 2 y 150 caracteres.";

            if (!ProviderNameRegex.IsMatch(nombre))
                return "El nombre contiene caracteres no permitidos.";

            if (!string.IsNullOrWhiteSpace(contacto))
            {
                if (contacto.Length > 120)
                    return "El contacto no puede exceder 120 caracteres.";

                if (!ContactNameRegex.IsMatch(contacto))
                    return "El contacto contiene caracteres no permitidos.";
            }

            if (!string.IsNullOrWhiteSpace(telefono))
            {
                if (!PhoneRegex.IsMatch(telefono))
                    return "El teléfono debe contener entre 8 y 15 dígitos y solo puede incluir un '+' al inicio.";
            }

            if (!string.IsNullOrWhiteSpace(correo))
            {
                if (correo.Length > 150)
                    return "El correo no puede exceder 150 caracteres.";

                if (!EmailValidator.IsValid(correo))
                    return "El correo electrónico no es válido.";
            }

            if (!string.IsNullOrWhiteSpace(direccion) && direccion.Length > 300)
                return "La dirección no puede exceder 300 caracteres.";

            return null;
        }

        private static string NormalizeRequiredText(string value)
        {
            var normalized = NormalizeSpaces(value).Trim();
            return normalized;
        }

        private static string? NormalizeOptionalText(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var normalized = NormalizeSpaces(value).Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static string? NormalizeEmail(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var normalized = NormalizeSpaces(value).Trim().ToLowerInvariant();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static string? NormalizePhone(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var raw = value.Trim();
            var normalized = raw.StartsWith("+")
                ? "+" + new string(raw.Skip(1).Where(char.IsDigit).ToArray())
                : new string(raw.Where(char.IsDigit).ToArray());

            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static string NormalizeSpaces(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return string.Empty;

            return MultiSpaceRegex.Replace(value, " ");
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