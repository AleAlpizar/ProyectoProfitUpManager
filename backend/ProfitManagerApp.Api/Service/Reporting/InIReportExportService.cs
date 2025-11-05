using ProfitManagerApp.Api.Dtos;

public interface IReportExportService
{
    byte[] ToExcel(ReportRegisterDto report);
    byte[] ToPdf(ReportRegisterDto report);
}
