namespace ProfitManagerApp.Api.Dtos
{
    public sealed class ReportRegisterDto
    {
        public string Key { get; set; } = "default";
        public string Title { get; set; } = "Reporte";
        public List<Dictionary<string, object?>> Rows { get; set; } = new();

        public List<string>? ColumnOrder { get; set; }

      
        public Dictionary<string, string>? Headers { get; set; }

       
        public Dictionary<string, string>? Meta { get; set; }
    }
}
