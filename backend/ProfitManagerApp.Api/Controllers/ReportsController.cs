using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Dtos;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportSessionStore _store;
    private readonly IReportExportService _export;

    public ReportsController(IReportSessionStore store, IReportExportService export)
    {
        _store = store;
        _export = export;
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

    [HttpPost("{key}/export/excel")]
    public IActionResult ExportExcel([FromRoute] string key = "default")
    {
        var uid = GetUserId();
        if (uid is null) return Unauthorized();

        var report = _store.Get(uid.Value, key);
        if (report is null)
            return BadRequest(new { code = "NO_REPORT", msg = "Primero debe generar un reporte para poder exportarlo." });

        try
        {
            var bytes = _export.ToExcel(report);
            var fileName = $"{(string.IsNullOrWhiteSpace(report.Title) ? "Reporte" : report.Title)}.xlsx";
            return File(bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
        }
        catch (Exception ex)
        {
            return Problem(title: "EXPORT_FAILED", detail: ex.Message, statusCode: 500);
        }
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
            var fileName = $"{(string.IsNullOrWhiteSpace(report.Title) ? "Reporte" : report.Title)}.pdf";
            return File(bytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            return Problem(title: "EXPORT_FAILED", detail: ex.Message, statusCode: 500);
        }
    }
}
