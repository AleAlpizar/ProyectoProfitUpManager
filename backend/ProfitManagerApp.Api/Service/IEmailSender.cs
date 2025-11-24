using System.Threading.Tasks;

namespace ProfitManagerApp.Api.Services
{
    public interface IEmailSender
    {
        Task SendAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null);
    }
}
