using System.Globalization;
using ProfitManagerApp.Api.Dtos;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public sealed class ReportExportService : IReportExportService
{
    public ReportExportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] ToPdf(ReportRegisterDto report)
    {
        var (fields, titles) = ResolveColumns(report);

        string rolField = fields.FirstOrDefault(f => f.Equals("Rol", StringComparison.OrdinalIgnoreCase)) ?? "";
        string estadoField = fields.FirstOrDefault(f => f.Equals("EstadoUsuario", StringComparison.OrdinalIgnoreCase)) ?? "";

        int total = report.Rows.Count;

        var porRol = (!string.IsNullOrEmpty(rolField))
            ? report.Rows
                .GroupBy(r => (r.TryGetValue(rolField, out var v) ? v?.ToString() : null) ?? "SIN_ROL")
                .OrderBy(g => g.Key)
                .Select(g => (Rol: g.Key, Count: g.Count()))
                .ToList()
            : new List<(string Rol, int Count)>();

        var porEstado = (!string.IsNullOrEmpty(estadoField))
            ? report.Rows
                .GroupBy(r => (r.TryGetValue(estadoField, out var v) ? v?.ToString() : null) ?? "")
                .OrderBy(g => g.Key)
                .Select(g => (Estado: g.Key, Count: g.Count()))
                .ToList()
            : new List<(string Estado, int Count)>();

        int activos = porEstado.Where(x => x.Estado.Equals("ACTIVO", StringComparison.OrdinalIgnoreCase)).Sum(x => x.Count);
        int pausados = porEstado.Where(x => x.Estado.Equals("PAUSADO", StringComparison.OrdinalIgnoreCase)).Sum(x => x.Count);
        int vacaciones = porEstado.Where(x => x.Estado.Equals("VACACIONES", StringComparison.OrdinalIgnoreCase)).Sum(x => x.Count);

        var brand = "#b1005f";           
        var pageBg = "#05070A";          
        var cardBg = "#020617";          
        var zebra1 = "#020617";         
        var zebra2 = "#030712";         
        var headerBg = "#020617";       
        var headerBorder = "#111827";   

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);

                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text(x =>
                        {
                            x.DefaultTextStyle(s => s.FontSize(20).Bold().FontColor(Colors.White));
                            x.Span(string.IsNullOrWhiteSpace(report.Title) ? "Usuarios" : report.Title)
                             .FontColor(brand);
                        });

                        if (report.Meta is { Count: > 0 })
                        {
                            col.Item().Text(t =>
                            {
                                t.DefaultTextStyle(s => s.FontSize(10).FontColor("#9CA3AF"));
                                t.Span("Filtros: ").SemiBold();
                                t.Span(string.Join("  •  ", report.Meta.Select(kv => $"{kv.Key}={kv.Value}")));
                            });
                        }

                        col.Item().Text(t =>
                        {
                            t.DefaultTextStyle(s => s.FontSize(9).FontColor("#6B7280"));
                            t.Span($"Generado: {DateTime.Now:yyyy-MM-dd HH:mm}");
                        });
                    });
                });

                page.Content()
                    .Background(pageBg)
                    .PaddingTop(10)
                    .Column(col =>
                    {
                        col.Item().PaddingBottom(8).Row(r =>
                        {
                            r.RelativeItem().Element(e => KpiCard(e, "Usuarios totales", total.ToString("N0", CultureInfo.InvariantCulture), brand, cardBg));
                            r.RelativeItem().Element(e => KpiCard(e, "Activos", activos.ToString("N0"), "#22c55e", cardBg));
                            r.RelativeItem().Element(e => KpiCard(e, "Pausados", pausados.ToString("N0"), "#eab308", cardBg));
                            r.RelativeItem().Element(e => KpiCard(e, "Vacaciones", vacaciones.ToString("N0"), "#fb923c", cardBg));
                        });

                        if (porRol.Count > 0)
                        {
                            col.Item().PaddingBottom(8).Row(r =>
                            {
                                foreach (var (rol, cnt) in porRol)
                                    r.RelativeItem().Element(e => SmallStat(e, rol, cnt.ToString("N0"), "#38bdf8", "#020617"));
                            });
                        }

                        col.Item().PaddingTop(5).Element(e =>
                        {
                            e.Border(1).BorderColor("#111827").Background(cardBg).Padding(4).Table(table =>
                            {
                                table.ColumnsDefinition(cols =>
                                {
                                    for (int i = 0; i < titles.Count; i++) cols.RelativeColumn();
                                });

                                table.Header(h =>
                                {
                                    foreach (var t in titles)
                                    {
                                        h.Cell().Element(HeaderCell).Text(x =>
                                        {
                                            x.DefaultTextStyle(s => s.SemiBold().FontSize(10).FontColor("#E5E7EB"));
                                            x.Span(t);
                                        });

                                        IContainer HeaderCell(IContainer c) =>
                                            c.Background(headerBg)
                                             .BorderBottom(1)
                                             .BorderColor(headerBorder)
                                             .PaddingVertical(6)
                                             .PaddingHorizontal(6);
                                    }
                                });

                                int idx = 0;
                                foreach (var r in report.Rows)
                                {
                                    bool even = (idx++ % 2 == 0);

                                    for (int c = 0; c < fields.Count; c++)
                                    {
                                        var field = fields[c];
                                        r.TryGetValue(field, out var val);
                                        var text = val?.ToString() ?? "";

                                        table.Cell().Element(cell =>
                                        {
                                            var box = cell
                                                .Background(even ? zebra1 : zebra2)
                                                .PaddingVertical(4)
                                                .PaddingHorizontal(6);

                                            box = box.BorderBottom(0.5f).BorderColor("#111827");

                                            if (!string.IsNullOrEmpty(estadoField) &&
                                                field.Equals(estadoField, StringComparison.OrdinalIgnoreCase))
                                            {
                                                box.Element(x => Badge(x, text));
                                            }
                                            else
                                            {
                                                box.Text(t =>
                                                {
                                                    t.DefaultTextStyle(s => s.FontSize(9).FontColor("#E5E7EB"));
                                                    t.Span(text);
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        });
                    });

                page.Footer().AlignRight().Text(t =>
                {
                    t.DefaultTextStyle(s => s.FontSize(9).Light().FontColor("#6B7280"));
                    t.Span("Página "); t.CurrentPageNumber(); t.Span(" / "); t.TotalPages();
                });
            });
        }).GeneratePdf();

        return pdf;
    }

    private static void KpiCard(IContainer c, string title, string value, string color, string bg)
    {
        c.Background(bg)
         .Border(1f)
         .BorderColor("#111827")
         .Padding(10)
         .Column(col =>
         {
             col.Spacing(2);

             col.Item().Text(x =>
             {
                 x.DefaultTextStyle(s => s.FontSize(9).FontColor("#9CA3AF"));
                 x.Span(title);
             });

             col.Item().Text(x =>
             {
                 x.DefaultTextStyle(s => s.FontSize(18).Bold().FontColor(color));
                 x.Span(value);
             });
         });
    }

    private static void SmallStat(IContainer c, string title, string value, string color, string bg)
    {
        c.Background(bg)
         .Border(1f)
         .BorderColor("#111827")
         .Padding(8)
         .Column(col =>
         {
             col.Item().Text(x =>
             {
                 x.DefaultTextStyle(s => s.FontSize(9).FontColor("#9CA3AF"));
                 x.Span(title);
             });

             col.Item().Text(x =>
             {
                 x.DefaultTextStyle(s => s.FontSize(14).Bold().FontColor(color));
                 x.Span(value);
             });
         });
    }

    private static void Badge(IContainer c, string label)
    {
        var normalized = label?.ToUpperInvariant() ?? "";

        var display = normalized switch
        {
            "ACTIVE" => "ACTIVO",
            "PAUSED" => "PAUSADO",
            "VACATION" => "VACACIONES",
            _ => normalized
        };

        var (bg, fg) = display switch
        {
            "ACTIVO" => ("#14532d", "#bbf7d0"),       
            "PAUSADO" => ("#78350f", "#fee2b3"),      
            "VACACIONES" => ("#7c2d12", "#fed7aa"),   
            _ => ("#1f2933", "#e5e7eb")
        };

        c.Row(r =>
        {
            r.AutoItem()
             .Background(bg)
             .Border(0.5f)
             .BorderColor("#111827")
             .PaddingVertical(2)
             .PaddingHorizontal(8)
             .Text(x =>
             {
                 x.DefaultTextStyle(s => s.FontSize(9).SemiBold().FontColor(fg));
                 x.Span(display);
             });
        });
    }

    private static (List<string> fields, List<string> titles) ResolveColumns(ReportRegisterDto report)
    {
        var fields = report.ColumnOrder ?? report.Rows.FirstOrDefault()?.Keys.ToList() ?? new List<string>();

        var titles = fields.Select(f =>
            (report.Headers != null &&
             report.Headers.TryGetValue(f, out var t) &&
             !string.IsNullOrWhiteSpace(t))
                ? t
                : f
        ).ToList();

        return (fields, titles);
    }
}
