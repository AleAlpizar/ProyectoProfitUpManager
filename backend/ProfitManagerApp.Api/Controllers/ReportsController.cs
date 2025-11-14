using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Dtos;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportSessionStore _store;
    private readonly IReportExportService _export;
    private readonly ReportUsersService _users;

    public ReportsController(IReportSessionStore store, IReportExportService export, ReportUsersService users)
    {
        _store = store;
        _export = export;
        _users = users;
    }

    private int? GetUserId()
    {
        var idClaim = User?.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idClaim, out var id) ? id : null;
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] ReportRegisterDto dto)
    {
        var uid = GetUserId();
        if (uid is null) return Unauthorized();
        if (dto is null || dto.Rows is null || dto.Rows.Count == 0)
            return BadRequest(new { code = "REPORT_REQUIRED", msg = "Debe proveer datos del reporte." });

        _store.Register(uid.Value, dto);
        return Ok(new { message = "Reporte registrado en sesión.", key = dto.Key });
    }

    [HttpGet("users/register-from-db")]
    public async Task<IActionResult> RegisterUsersFromDb([FromQuery] string? q, [FromQuery] string? estado, [FromQuery] string? rol,
                                                         [FromQuery] string key = "usuarios", [FromQuery] string title = "Usuarios")
    {
        var uid = GetUserId();
        if (uid is null) return Unauthorized();

        var data = await _users.GetUsersForReportAsync(new ReportUsersService.ReportFilter { Q = q, Estado = estado, Rol = rol });

        var dto = BuildUsersReportDto(data, key, title, q, estado, rol);
        _store.Register(uid.Value, dto);
        return Ok(new { message = "Reporte de usuarios registrado.", key });
    }

    [HttpPost("{key}/export/pdf")]
    public IActionResult ExportPdf([FromRoute] string key = "default")
    {
        var uid = GetUserId();
        if (uid is null) return Unauthorized();

        var report = _store.Get(uid.Value, key);
        if (report is null)
            return BadRequest(new { code = "NO_REPORT", msg = "Primero debe generar un reporte para poder exportarlo." });

        try
        {
            var bytes = _export.ToPdf(report);

            var fileName = $"Control Usuarios - {DateTime.Now:yyyy-MM-dd}.pdf";

            return File(bytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            return Problem(title: "EXPORT_FAILED", detail: ex.Message, statusCode: 500);
        }
    }

    private static ReportRegisterDto BuildUsersReportDto(
        IReadOnlyList<ReportUsersService.ReportUserRow> data,
        string key, string title, string? q, string? estado, string? rol)
    {
        var columnOrder = new List<string>
        {
            "Nombre","Apellido","Correo","Telefono","Rol","EstadoUsuario"
        };

        var headers = new Dictionary<string, string>
        {
            ["Nombre"] = "Nombre",
            ["Apellido"] = "Apellido",
            ["Correo"] = "Correo",
            ["Telefono"] = "Teléfono",
            ["Rol"] = "Rol",
            ["EstadoUsuario"] = "Estado"
        };

        var rows = data.Select(x => new Dictionary<string, object?>
        {
            ["Nombre"] = x.Nombre,
            ["Apellido"] = x.Apellido ?? "",
            ["Correo"] = x.Correo,
            ["Telefono"] = x.Telefono ?? "",
            ["Rol"] = string.IsNullOrWhiteSpace(x.Rol) ? "Empleado" : x.Rol,
            ["EstadoUsuario"] = x.EstadoUsuario
        }).ToList();

        var meta = new Dictionary<string, string>();
        if (!string.IsNullOrWhiteSpace(q)) meta["Q"] = q!;
        if (!string.IsNullOrWhiteSpace(estado)) meta["Estado"] = estado!;
        if (!string.IsNullOrWhiteSpace(rol)) meta["Rol"] = rol!;

        return new ReportRegisterDto
        {
            Key = key,
            Title = title,
            ColumnOrder = columnOrder,
            Headers = headers,
            Rows = rows,
            Meta = meta
        };
    }
}
