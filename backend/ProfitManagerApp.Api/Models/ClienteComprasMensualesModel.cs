using System;

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

    public class ClienteTopModel
    {
        public int ClienteID { get; set; }
        public int TotalVentas { get; set; }
        public decimal MontoTotal { get; set; }
        public decimal TicketPromedio { get; set; }
        public DateTime UltimaCompra { get; set; }
    }

    public class ClienteInactivoModel
    {
        public int ClienteID { get; set; }
        public int TotalVentas { get; set; }
        public decimal MontoTotal { get; set; }
        public DateTime UltimaCompra { get; set; }
        public int MesesSinCompra { get; set; }
    }

    public class ClienteVentaDetalleModel
    {
        public int VentaID { get; set; }
        public DateTime Fecha { get; set; }
        public decimal SubTotal { get; set; }
        public decimal Descuento { get; set; }
        public decimal Total { get; set; }
        public int CantidadLineas { get; set; }
    }
}
