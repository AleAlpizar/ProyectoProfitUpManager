using ProfitManagerApp.Api.Enums;

namespace ProfitManagerApp.Api.Models.Rows
{
  public class VentaRow
  {
    public int VentaID { get; set; }
    public int ClienteID { get; set; }

    public DateTime Fecha { get; set; }

    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; } // 0..100

    //public decimal ImpuestoPorcentaje { get; set; }  // 0..100
    //public decimal ImpuestoMonto { get; set; }

    public decimal Total { get; set; }

    //public string? Observaciones { get; set; }
    public EstadoVentaEnum Estado { get; set; } = EstadoVentaEnum.Registrada;

    public DateTime CreatedAt { get; set; }
    public int? UsuarioID { get; set; }

    public ICollection<VentaItemRow> Detalles { get; set; } = new List<VentaItemRow>();
  }
}
