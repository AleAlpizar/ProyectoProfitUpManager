using ProfitManagerApp.Api.Enums;

namespace ProfitManagerApp.Api.Models.Rows
{
    public class OrdenCompraRow
    {
        public int OrdenCompraID { get; set; }

        public string? CodigoOrden { get; set; }

        public int ProveedorID { get; set; }

        public DateTime FechaSolicitud { get; set; }

        public DateTime? FechaEstimada { get; set; }

        public EstadoOrdenCompraEnum Estado { get; set; } = EstadoOrdenCompraEnum.Pendiente;

        public decimal Total { get; set; }

        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }

        public ICollection<OrdenCompraItemRow> Detalles { get; set; } = new List<OrdenCompraItemRow>();
    }
}
