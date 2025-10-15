using System.Net;
using System.Net.Mail;

namespace ProfitManagerApp.Api.Auth
{
    public class SmtpMailSender : IMailSender
    {
        private readonly IConfiguration _cfg;
        public SmtpMailSender(IConfiguration cfg) { _cfg = cfg; }

        public async Task SendPasswordResetAsync(string toEmail, string subject, string htmlBody)
        {
            var host = _cfg["Mail:Smtp:Host"] ?? throw new InvalidOperationException("Mail:Smtp:Host no configurado");
            var port = int.TryParse(_cfg["Mail:Smtp:Port"], out var p) ? p : 587;
            var user = _cfg["Mail:Smtp:User"];
            var pass = _cfg["Mail:Smtp:Pass"];
            var from = _cfg["Mail:From"] ?? user ?? throw new InvalidOperationException("Mail:From o Mail:Smtp:User no configurado");
            var enableSsl = bool.TryParse(_cfg["Mail:Smtp:EnableSsl"], out var ssl) ? ssl : true;

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false
            };

            if (!string.IsNullOrWhiteSpace(user))
                client.Credentials = new NetworkCredential(user, pass);

            using var msg = new MailMessage(from, toEmail, subject, htmlBody) { IsBodyHtml = true };
            await client.SendMailAsync(msg);
        }
    }
}
