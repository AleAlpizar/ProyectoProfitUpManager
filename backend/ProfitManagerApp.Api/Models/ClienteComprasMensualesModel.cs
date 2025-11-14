namespace ProfitManagerApp.Api.Models.Rows
{
    public class ClienteComprasMensualesModel
    {
        public int Anio { get; set; }
        public int Mes { get; set; }             
        public int TotalClientes { get; set; }   
        public int TotalVentas { get; set; }     
        public decimal MontoTotal { get; set; }  
    }
}
