namespace ProfitManagerApp.Api.Services
{
    public sealed class SmtpSettings
    {
        public string Host { get; set; } = "";
        public int Port { get; set; } = 587;
        public bool EnableSsl { get; set; } = true;

        public string UserName { get; set; } = "";
        public string Password { get; set; } = "";

     
        public string From { get; set; } = "";
    }
}
