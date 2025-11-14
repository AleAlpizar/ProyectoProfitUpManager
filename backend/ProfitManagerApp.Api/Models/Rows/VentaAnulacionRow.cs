using ProfitManagerApp.Api.Models.Rows;

namespace ProfitManagerApp.Api.Rows
{
    public class VentaAnulacionRow
    {
        public int AnulacionID { get; set; }
        public int VentaID { get; set; }
        public string? Motivo { get; set; }
        public DateTime FechaAnulacion { get; set; }
        public int? UsuarioID { get; set; }

        public VentaRow Venta { get; set; } = null!;
    }
}
