using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ProfitManagerApp.Api.Auth;                
using ProfitManagerApp.Api.Background;          
using ProfitManagerApp.Api.Data.Abstractions;  
using ProfitManagerApp.Api.Dtos;               

namespace ProfitManagerApp.Api.Services
{
    public sealed class VencimientosNotificationService : IVencimientosNotificationService
    {
        private readonly IVencimientosRepository _repo;
        private readonly IMailSender _mailSender;
        private readonly ILogger<VencimientosNotificationService> _logger;
        private readonly VencimientosNotificationOptions _options;

        public VencimientosNotificationService(
            IVencimientosRepository repo,
            IMailSender mailSender,
            ILogger<VencimientosNotificationService> logger,
            IOptions<VencimientosNotificationOptions> options)
        {
            _repo = repo ?? throw new ArgumentNullException(nameof(repo));
            _mailSender = mailSender ?? throw new ArgumentNullException(nameof(mailSender));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _options = options?.Value ?? new VencimientosNotificationOptions();
        }

        public async Task<int> ProcesarAlertasYEnviarCorreosAsync(
            int umbralDefault,
            CancellationToken ct = default)
        {
            if (ct.IsCancellationRequested)
                return 0;

            if (!_options.Enabled)
            {
                _logger.LogDebug(
                    "VencimientosNotificationService: notificaciones deshabilitadas por configuración.");
                return 0;
            }

            var to = _options.ToEmail;
            if (string.IsNullOrWhiteSpace(to))
            {
                _logger.LogWarning(
                    "VencimientosNotificationService: 'ToEmail' no está configurado.");
                return 0;
            }

            var subject = string.IsNullOrWhiteSpace(_options.Subject)
                ? "Recordatorio de vencimientos"
                : _options.Subject!;

            var umbral = umbralDefault > 0 ? umbralDefault : _options.UmbralDefaultDias;

            var alertas = await _repo.ListAlertasPendientesAsync(umbral);

            if (alertas == null || alertas.Count == 0)
            {
                _logger.LogInformation(
                    "VencimientosNotificationService: no hay alertas para el umbral {Umbral}.",
                    umbral);
                return 0;
            }

            var html = BuildHtmlBody(alertas);

            try
            {
                await _mailSender.SendEmailAsync(to, subject, html, ct);

                _logger.LogInformation(
                    "VencimientosNotificationService: se envió correo a {To} con {Count} alertas.",
                    to,
                    alertas.Count);

                return alertas.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "VencimientosNotificationService: error enviando correo de vencimientos.");
                throw;
            }
        }

        private static string BuildHtmlBody(IReadOnlyList<AlertRowDto> alertas)
        {
            var sb = new StringBuilder();

            sb.AppendLine("<h2 style=\"font-family:Segoe UI,Arial,sans-serif;\">Vencimientos próximos / vencidos</h2>");
            sb.AppendLine("<p style=\"font-family:Segoe UI,Arial,sans-serif;font-size:13px;\">");
            sb.AppendLine("Resumen automático de los documentos configurados en el módulo de Vencimientos.");
            sb.AppendLine("</p>");

            sb.AppendLine("<table style=\"border-collapse:collapse;min-width:520px;font-family:Segoe UI,Arial,sans-serif;font-size:13px;\">");
            sb.AppendLine("<thead><tr>");
            sb.AppendLine("<th style=\"border:1px solid #ddd;padding:4px 6px;text-align:left;\">Documento</th>");
            sb.AppendLine("<th style=\"border:1px solid #ddd;padding:4px 6px;text-align:left;\">Tipo</th>");
            sb.AppendLine("<th style=\"border:1px solid #ddd;padding:4px 6px;text-align:left;\">Vence</th>");
            sb.AppendLine("<th style=\"border:1px solid #ddd;padding:4px 6px;text-align:right;\">Días</th>");
            sb.AppendLine("<th style=\"border:1px solid #ddd;padding:4px 6px;text-align:left;\">Estado</th>");
            sb.AppendLine("</tr></thead><tbody>");

            foreach (var a in alertas
                         .OrderBy(x => x.FechaVencimiento)
                         .ThenBy(x => x.Titulo))
            {
                var fecha = a.FechaVencimiento.ToString("yyyy-MM-dd");
                var estadoLegible = a.Estado switch
                {
                    "VENCIDO" => "Vencido",
                    "PROXIMO" => "Próximo",
                    _ => "Vigente"
                };

                sb.AppendLine("<tr>");
                sb.AppendFormat(
                    "<td style=\"border:1px solid #ddd;padding:4px 6px;\">{0}</td>",
                    System.Net.WebUtility.HtmlEncode(a.Titulo));
                sb.AppendFormat(
                    "<td style=\"border:1px solid #ddd;padding:4px 6px;\">{0}</td>",
                    System.Net.WebUtility.HtmlEncode(a.TipoNombre));
                sb.AppendFormat(
                    "<td style=\"border:1px solid #ddd;padding:4px 6px;\">{0}</td>",
                    fecha);
                sb.AppendFormat(
                    "<td style=\"border:1px solid #ddd;padding:4px 6px;text-align:right;\">{0}</td>",
                    a.DaysToDue);
                sb.AppendFormat(
                    "<td style=\"border:1px solid #ddd;padding:4px 6px;\">{0}</td>",
                    estadoLegible);
                sb.AppendLine("</tr>");
            }

            sb.AppendLine("</tbody></table>");

            sb.AppendLine("<p style=\"font-family:Segoe UI,Arial,sans-serif;font-size:12px;color:#666;margin-top:10px;\">");
            sb.AppendLine("Si ya gestionaste alguno de estos documentos, puedes marcarlo como inactivo en el módulo de Vencimientos.");
            sb.AppendLine("</p>");

            return sb.ToString();
        }
    }
}
