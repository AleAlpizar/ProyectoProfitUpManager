using ProfitManagerApp.Api.Dtos;

public interface IReportSessionStore
{
    void Register(int userId, ReportRegisterDto report);
    ReportRegisterDto? Get(int userId, string key);
    void Clear(int userId, string key);
}
