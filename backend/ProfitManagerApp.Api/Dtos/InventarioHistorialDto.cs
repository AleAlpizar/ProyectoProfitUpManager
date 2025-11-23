using System;

namespace ProfitManagerApp.Domain.Inventory.Dto
{
    public class InventarioHistorialQueryDto
    {
        public int? ProductoID { get; set; }
        public int? BodegaID { get; set; }
        public DateTime? Desde { get; set; }
        public DateTime? Hasta { get; set; }
        public string? TipoMovimiento { get; set; }
        public int? UsuarioID { get; set; }

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }

    public class InventarioMovimientoRowDto
    {
        public long MovimientoID { get; set; }
        public DateTime FechaMovimiento { get; set; }

        public int ProductoID { get; set; }
        public string ProductoNombre { get; set; } = "";
        public string? SKU { get; set; }

        public int BodegaID { get; set; }
        public string BodegaNombre { get; set; } = "";

        public string TipoMovimiento { get; set; } = "";
        public decimal Cantidad { get; set; }

        public decimal? SaldoAnterior { get; set; }
        public decimal? SaldoNuevo { get; set; }

        public string? Motivo { get; set; }
        public string? ReferenciaTipo { get; set; }

        public int? UsuarioID { get; set; }
        public string? UsuarioNombre { get; set; }
    }
}
