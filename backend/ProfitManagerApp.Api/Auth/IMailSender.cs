namespace ProfitManagerApp.Api.Auth;

public interface IMailSender
{
    Task SendPasswordResetAsync(string toEmail, string subject, string htmlBody);
    Task SendEmailAsync(string to, string subject, string htmlBody);

    Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
    


}
