using System.Data;
using OfficeOpenXml;
using ProfitManagerApp.Api.Dtos;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public sealed class ReportExportService : IReportExportService
{
    public byte[] ToExcel(ReportRegisterDto report)
    {
        OfficeOpenXml.ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;
        using var pkg = new ExcelPackage();
        var ws = pkg.Workbook.Worksheets.Add(string.IsNullOrWhiteSpace(report.Title) ? "Reporte" : report.Title);

        var headers = report.ColumnOrder ?? report.Rows.FirstOrDefault()?.Keys.ToList() ?? new List<string>();
        for (int c = 0; c < headers.Count; c++)
            ws.Cells[1, c + 1].Value = headers[c];

        for (int r = 0; r < report.Rows.Count; r++)
        {
            var row = report.Rows[r];
            for (int c = 0; c < headers.Count; c++)
                ws.Cells[r + 2, c + 1].Value = row.TryGetValue(headers[c], out var val) ? val : null;
        }

        ws.Cells[1, 1, 1, headers.Count].Style.Font.Bold = true;
        ws.Cells.AutoFitColumns();

        return pkg.GetAsByteArray();
    }

    public byte[] ToPdf(ReportRegisterDto report)
    {
        var headers = report.ColumnOrder ?? report.Rows.FirstOrDefault()?.Keys.ToList() ?? new List<string>();
        var pdf = QuestPDF.Fluent.Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(20);
                page.Header().Text(report.Title).SemiBold().FontSize(16);
                page.Content().Table(table =>
                {
                    foreach (var _ in headers) table.ColumnsDefinition(c => c.RelativeColumn());

                    table.Header(h =>
                    {
                        foreach (var hname in headers)
                            h.Cell().Element(CellHeader).Text(hname);
                        static IContainer CellHeader(IContainer c) =>
                            c.DefaultTextStyle(x => x.SemiBold()).Padding(4).Background(Colors.Grey.Lighten3);
                    });

                    foreach (var row in report.Rows)
                    {
                        foreach (var hname in headers)
                        {
                            row.TryGetValue(hname, out var val);
                            table.Cell().Padding(4).Text(val?.ToString() ?? "");
                        }
                    }
                });
                page.Footer().AlignRight().Text(x =>
                {
                    x.Span("Generado: ");
                    x.Span(DateTime.Now.ToString("yyyy-MM-dd HH:mm"));
                });
            });
        }).GeneratePdf();

        return pdf;
    }
}
