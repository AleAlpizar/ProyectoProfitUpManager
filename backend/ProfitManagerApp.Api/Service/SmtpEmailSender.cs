using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace ProfitManagerApp.Api.Services
{
    public sealed class SmtpEmailSender : IEmailSender
    {
        private readonly SmtpSettings _settings;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IOptions<SmtpSettings> options, ILogger<SmtpEmailSender> logger)
        {
            _settings = options.Value;
            _logger = logger;
        }

        public async Task SendAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null)
        {
            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                EnableSsl = _settings.EnableSsl,
                Credentials = new NetworkCredential(_settings.UserName, _settings.Password)
            };

            using var msg = new MailMessage
            {
                From = new MailAddress(_settings.From),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            msg.To.Add(toEmail);

            if (!string.IsNullOrWhiteSpace(plainTextBody))
            {
                var alt = AlternateView.CreateAlternateViewFromString(plainTextBody, null, "text/plain");
                msg.AlternateViews.Add(alt);
            }

            try
            {
                await client.SendMailAsync(msg);
            }
            catch (SmtpException ex)
            {
                _logger.LogError(ex, "Error enviando correo a {To}", toEmail);
                throw;
            }
        }
    }
}
