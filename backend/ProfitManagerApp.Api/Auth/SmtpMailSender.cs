using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using ProfitManagerApp.Api.Services;

namespace ProfitManagerApp.Api.Auth
{
    public sealed class SmtpMailSender : IEmailSender
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

            var port = int.TryParse(_cfg["Mail:Smtp:Port"], out var parsedPort) ? parsedPort : 587;
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

        private MailMessage CreateMessage(string toEmail, string subject, string htmlBody, string? plainTextBody = null)
        {
            var from = _cfg["Mail:From"]
                       ?? _cfg["Mail:Smtp:User"]
                       ?? throw new InvalidOperationException("Mail:From o Mail:Smtp:User no configurados");

            var msg = new MailMessage(from, toEmail)
            {
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            if (!string.IsNullOrWhiteSpace(plainTextBody))
            {
                msg.AlternateViews.Add(
                    AlternateView.CreateAlternateViewFromString(plainTextBody, null, "text/plain")
                );
            }

            return msg;
        }

        public async Task SendAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null)
        {
            using var client = CreateClient();
            using var msg = CreateMessage(toEmail, subject, htmlBody, plainTextBody);
            await client.SendMailAsync(msg);
        }
    }
}