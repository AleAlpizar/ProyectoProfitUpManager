using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace ProfitManagerApp.Api.Auth
{
    public sealed class SmtpMailSender : IMailSender
    {
        private readonly IConfiguration _cfg;

        public SmtpMailSender(IConfiguration cfg)
        {
            _cfg = cfg;
        }

        private SmtpClient CreateClient()
        {
            var host = _cfg["Mail:Smtp:Host"]
                       ?? throw new InvalidOperationException("Mail:Smtp:Host no configurado");

            var portStr = _cfg["Mail:Smtp:Port"];
            var port = 587;
            if (!string.IsNullOrWhiteSpace(portStr) && int.TryParse(portStr, out var p))
                port = p;

            var user = _cfg["Mail:Smtp:User"];
            var pass = _cfg["Mail:Smtp:Pass"];
            var enableSsl = bool.TryParse(_cfg["Mail:Smtp:EnableSsl"], out var ssl) ? ssl : true;

            var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false
            };

            if (!string.IsNullOrWhiteSpace(user))
            {
                client.Credentials = new NetworkCredential(user, pass);
            }

            return client;
        }

        private MailMessage CreateMessage(string toEmail, string subject, string htmlBody)
        {
            var from = _cfg["Mail:From"]
                       ?? _cfg["Mail:Smtp:User"]
                       ?? throw new InvalidOperationException("Mail:From o Mail:Smtp:User no configurados");

            return new MailMessage(from, toEmail, subject, htmlBody)
            {
                IsBodyHtml = true
            };
        }


        public Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return SendEmailAsync(toEmail, subject, htmlBody);
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            using var client = CreateClient();
            using var msg = CreateMessage(toEmail, subject, htmlBody);
            await client.SendMailAsync(msg);
        }
        public Task SendPasswordResetAsync(string toEmail, string subject, string htmlBody)
            => SendEmailAsync(toEmail, subject, htmlBody);
    }
}
