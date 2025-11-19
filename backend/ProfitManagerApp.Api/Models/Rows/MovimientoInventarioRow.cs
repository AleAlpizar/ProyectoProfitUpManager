using System;

namespace ProfitManagerApp.Api.Models.Rows
{
    public class MovimientoInventarioRow
    {
        public long MovimientoID { get; set; }
        public int ProductoID { get; set; }
        public int BodegaID { get; set; }
        public string TipoMovimiento { get; set; } = default!;
        public decimal Cantidad { get; set; }
        public string? ReferenciaTipo { get; set; }
        public string? Motivo { get; set; }
        public DateTime FechaMovimiento { get; set; }
        public int? UsuarioID { get; set; }
    }
}
