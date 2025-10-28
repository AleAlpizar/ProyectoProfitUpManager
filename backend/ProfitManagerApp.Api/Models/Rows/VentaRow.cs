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
    //public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    //public int? CreatedBy { get; set; }

    public ICollection<VentaItemRow> Detalles { get; set; } = new List<VentaItemRow>();
  }
}
