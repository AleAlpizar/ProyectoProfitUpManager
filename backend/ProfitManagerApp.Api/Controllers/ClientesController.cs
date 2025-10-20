using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Application.Clientes;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ProfitManagerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController(ClienteHandler handlers) : ControllerBase
{

  private int? GetUserId()
  {
    var v =
        User.FindFirstValue("uid") ??
        User.FindFirstValue(ClaimTypes.NameIdentifier) ??
        User.FindFirstValue(JwtRegisteredClaimNames.Sub);

    return int.TryParse(v, out var id) ? id : (int?)null;
  }


  [HttpPost]
  [Authorize]
  public async Task<IActionResult> Create([FromBody] ClienteCreateDto dto, CancellationToken ct)
  {
    var user = GetUserId();

    if (!ModelState.IsValid) return ValidationProblem(ModelState);

    if (!string.IsNullOrWhiteSpace(dto.CodigoCliente)
        && await handlers.CodigoExisteAsync(dto.CodigoCliente!, ct))
      return Conflict(new { message = "CodigoCliente ya existe." });

    var model = await handlers.CrearAsync(
        dto.Nombre, dto.CodigoCliente, dto.TipoPersona, dto.Identificacion,
        dto.Correo, dto.Telefono, dto.Direccion, dto.IsActive,
        User, ct);

    // Puedes mapear model -> readDto si quieres mantener DTOs en la respuesta
    var read = new ClienteReadDto(
        model.ClienteID, model.CodigoCliente, model.Nombre, model.TipoPersona,
        model.Identificacion, model.Correo, model.Telefono, model.Direccion,
        model.FechaRegistro, model.IsActive, model.CreatedAt,
        model.CreatedBy, model.UpdatedAt, model.UpdatedBy, model.DescuentoPorcentaje, model.DescuentoDescripcion
    );

    return CreatedAtAction(nameof(GetById), new { id = model.ClienteID }, read);
  }

  [HttpGet("{id:int}")]
  [Authorize]
  public async Task<IActionResult> GetById(int id, CancellationToken ct)
  {
    var model = await handlers.ObtenerPorIdAsync(id, ct);
    if (model is null) return NotFound();

    var read = new ClienteReadDto(
        model.ClienteID, model.CodigoCliente, model.Nombre, model.TipoPersona,
        model.Identificacion, model.Correo, model.Telefono, model.Direccion,
        model.FechaRegistro, model.IsActive, model.CreatedAt,
        model.CreatedBy, model.UpdatedAt, model.UpdatedBy, model.DescuentoPorcentaje, model.DescuentoDescripcion
    );

    return Ok(read);
  }

  [HttpGet()]
  [Authorize]
  public async Task<IActionResult> GetAll(CancellationToken ct)
  {
    var model = await handlers.ObtenerClientes(ct);
    return Ok(model);
  }

  [HttpPatch("{id:int}/activo")]
  [Authorize] 
  public async Task<IActionResult> PatchActivo([FromRoute] int id, [FromBody] ClientePatchActivoDto dto, CancellationToken ct)
  {
    if (!ModelState.IsValid) return ValidationProblem(ModelState);

    var model = await handlers.SetActivoAsync(id, dto.IsActive, User, ct);
    if (model is null) return NotFound();

    return Ok(new
    {
      model.ClienteID,
      model.IsActive,
      model.UpdatedAt,
      model.UpdatedBy
    });
  }

  [HttpPut("{id:int}")]
  [Authorize]
  public async Task<IActionResult> Put([FromRoute] int id, [FromBody] ClienteUpdateDto dto, CancellationToken ct)
  {
    if (!ModelState.IsValid) return ValidationProblem(ModelState);

    try
    {
      var model = await handlers.ActualizarAsync(
          id,
          dto.Nombre, dto.CodigoCliente, dto.TipoPersona, dto.Identificacion,
          dto.Correo, dto.Telefono, dto.Direccion, dto.IsActive, dto.DescuentoPorcentaje ?? 0, dto.DescuentoDescripcion ?? "",
          User, ct);

      if (model is null) return NotFound();

      var read = new ClienteReadDto(
          model.ClienteID, model.CodigoCliente, model.Nombre, model.TipoPersona,
          model.Identificacion, model.Correo, model.Telefono, model.Direccion,
          model.FechaRegistro, model.IsActive, model.CreatedAt,
          model.CreatedBy, model.UpdatedAt, model.UpdatedBy,
          model.DescuentoPorcentaje, model.DescuentoDescripcion
      );

      return Ok(read); 
    }
    catch (InvalidOperationException ex) when (ex.Message.Contains("CodigoCliente"))
    {
      return Conflict(new { message = ex.Message });
    }
  }


}
