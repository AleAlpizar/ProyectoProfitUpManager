using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Application.Clientes;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ProfitManagerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador,Vendedor")]
public class ClientesController(ClienteHandler handlers) : ControllerBase
{
    private static string? Clean(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool EsTipoPersonaValido(string? tipoPersona)
    {
        if (string.IsNullOrWhiteSpace(tipoPersona)) return true;
        return tipoPersona.Equals("Natural", StringComparison.OrdinalIgnoreCase)
            || tipoPersona.Equals("Juridico", StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizarTipoPersona(string? tipoPersona)
    {
        if (string.IsNullOrWhiteSpace(tipoPersona)) return "Natural";
        return tipoPersona.Equals("Juridico", StringComparison.OrdinalIgnoreCase)
            ? "Juridico"
            : "Natural";
    }

    private static ClienteReadDto ToReadDto(dynamic model) =>
        new(
            model.ClienteID,
            model.CodigoCliente,
            model.Nombre,
            model.TipoPersona,
            model.Identificacion,
            model.Correo,
            model.Telefono,
            model.Direccion,
            model.FechaRegistro,
            model.IsActive,
            model.CreatedAt,
            model.CreatedBy,
            model.UpdatedAt,
            model.UpdatedBy,
            model.DescuentoPorcentaje,
            model.DescuentoDescripcion
        );

    private int? GetUserId()
    {
        var v =
            User.FindFirstValue("uid") ??
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(v, out var id) ? id : (int?)null;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ClienteCreateDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var nombre = Clean(dto.Nombre);
        var codigoCliente = Clean(dto.CodigoCliente);
        var tipoPersona = NormalizarTipoPersona(dto.TipoPersona);
        var identificacion = Clean(dto.Identificacion);
        var correo = Clean(dto.Correo);
        var telefono = Clean(dto.Telefono);
        var direccion = Clean(dto.Direccion);
        var descuentoDescripcion = Clean(dto.DescuentoDescripcion);

        if (string.IsNullOrWhiteSpace(nombre))
            return BadRequest(new { message = "El nombre es obligatorio." });

        if (!EsTipoPersonaValido(dto.TipoPersona))
            return BadRequest(new { message = "TipoPersona debe ser 'Natural' o 'Juridico'." });

        if (dto.DescuentoPorcentaje is < 0 or > 100)
            return BadRequest(new { message = "El descuento debe estar entre 0 y 100." });

        if (!string.IsNullOrWhiteSpace(codigoCliente)
            && await handlers.CodigoExisteAsync(codigoCliente, ct))
            return Conflict(new { message = "CodigoCliente ya existe." });

        var model = await handlers.CrearAsync(
            nombre,
            codigoCliente,
            tipoPersona,
            identificacion,
            correo,
            telefono,
            direccion,
            dto.IsActive,
            dto.DescuentoPorcentaje,
            descuentoDescripcion,
            User,
            ct
        );

        var read = ToReadDto(model);
        return CreatedAtAction(nameof(GetById), new { id = model.ClienteID }, read);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var model = await handlers.ObtenerPorIdAsync(id, ct);
        if (model is null) return NotFound(new { message = "Cliente no encontrado." });

        var read = ToReadDto(model);
        return Ok(read);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var models = await handlers.ObtenerClientes(ct);

        var result = models
            .Select(x => new ClienteReadDto(
                x.ClienteID,
                x.CodigoCliente,
                x.Nombre,
                x.TipoPersona,
                x.Identificacion,
                x.Correo,
                x.Telefono,
                x.Direccion,
                x.FechaRegistro,
                x.IsActive,
                x.CreatedAt,
                x.CreatedBy,
                x.UpdatedAt,
                x.UpdatedBy,
                x.DescuentoPorcentaje,
                x.DescuentoDescripcion
            ))
            .ToList();

        return Ok(result);
    }

    [HttpPatch("{id:int}/activo")]
    public async Task<IActionResult> PatchActivo([FromRoute] int id, [FromBody] ClientePatchActivoDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var model = await handlers.SetActivoAsync(id, dto.IsActive, User, ct);
        if (model is null) return NotFound(new { message = "Cliente no encontrado." });

        return Ok(new
        {
            message = dto.IsActive ? "Cliente reactivado correctamente." : "Cliente inactivado correctamente.",
            model.ClienteID,
            model.IsActive,
            model.UpdatedAt,
            model.UpdatedBy
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Put([FromRoute] int id, [FromBody] ClienteUpdateDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var nombre = Clean(dto.Nombre);
        var codigoCliente = Clean(dto.CodigoCliente);
        var tipoPersona = NormalizarTipoPersona(dto.TipoPersona);
        var identificacion = Clean(dto.Identificacion);
        var correo = Clean(dto.Correo);
        var telefono = Clean(dto.Telefono);
        var direccion = Clean(dto.Direccion);
        var descuentoDescripcion = Clean(dto.DescuentoDescripcion);

        if (string.IsNullOrWhiteSpace(nombre))
            return BadRequest(new { message = "El nombre es obligatorio." });

        if (!EsTipoPersonaValido(dto.TipoPersona))
            return BadRequest(new { message = "TipoPersona debe ser 'Natural' o 'Juridico'." });

        if (dto.DescuentoPorcentaje is < 0 or > 100)
            return BadRequest(new { message = "El descuento debe estar entre 0 y 100." });

        try
        {
            var model = await handlers.ActualizarAsync(
                id,
                nombre,
                codigoCliente,
                tipoPersona,
                identificacion,
                correo,
                telefono,
                direccion,
                dto.IsActive,
                dto.DescuentoPorcentaje ?? 0,
                descuentoDescripcion ?? string.Empty,
                User,
                ct
            );

            if (model is null) return NotFound(new { message = "Cliente no encontrado." });

            var read = ToReadDto(model);
            return Ok(read);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("CodigoCliente", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(new { message = ex.Message });
        }
    }
}