namespace ProfitManagerApp.Api.Dtos
{
    public sealed class VencimientoUpdateDto
    {
        public string Titulo { get; set; } = default!;
        public string? Descripcion { get; set; }
        public int TipoDocumentoVencimientoID { get; set; }
        public string? Referencia { get; set; }
        public DateTime? FechaEmision { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public int NotificarDiasAntes { get; set; } = 7;
        public bool IsActive { get; set; } = true;
    }

    public sealed class VencimientoRowDto
    {
        public int DocumentoVencimientoID { get; set; }
        public string Titulo { get; set; } = "";
        public string? Descripcion { get; set; }
        public int TipoDocumentoVencimientoID { get; set; }
        public string TipoNombre { get; set; } = "";
        public string? Referencia { get; set; }
        public DateTime? FechaEmision { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public int NotificarDiasAntes { get; set; }
        public int DaysToDue { get; set; }
        public string Estado { get; set; } = "VIGENTE";
    }

    public sealed class VencimientoDetalleDto
    {
        public int DocumentoVencimientoID { get; set; }
        public string Titulo { get; set; } = "";
        public string? Descripcion { get; set; }
        public int TipoDocumentoVencimientoID { get; set; }
        public string TipoNombre { get; set; } = "";
        public string? Referencia { get; set; }
        public DateTime? FechaEmision { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public int NotificarDiasAntes { get; set; }
        public bool IsActive { get; set; }
    }

    public sealed class TipoDocumentoVtoDto
    {
        public int TipoDocumentoVencimientoID { get; set; }
        public string Nombre { get; set; } = "";
        public string? Descripcion { get; set; }
        public bool IsActive { get; set; }
    }

    public sealed class AlertRowDto
    {
        public int DocumentoVencimientoID { get; set; }
        public string Titulo { get; set; } = "";
        public string TipoNombre { get; set; } = "";
        public string? Referencia { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public int NotificarDiasAntes { get; set; }
        public int DaysToDue { get; set; }
        public string Estado { get; set; } = "VIGENTE";
    }

    public sealed class VencimientoEmailAlertDto
    {
        public int DocumentoVencimientoID { get; set; }
        public string Titulo { get; set; } = "";
        public string TipoNombre { get; set; } = "";
        public string? Referencia { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public int NotificarDiasAntes { get; set; }
        public int DaysToDue { get; set; }
        public string Estado { get; set; } = "VIGENTE";

        public int? UsuarioID { get; set; }
        public string? UsuarioNombre { get; set; }
        public string? UsuarioCorreo { get; set; }
    }

}
