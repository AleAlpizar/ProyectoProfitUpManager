using ProfitManagerApp.Api.Dtos;

public interface IReportExportService
{
    byte[] ToPdf(ReportRegisterDto report);
}
