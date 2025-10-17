namespace ProfitManagerApp.Api.Auth;

public interface IMailSender
{
    Task SendPasswordResetAsync(string toEmail, string subject, string htmlBody);
}
