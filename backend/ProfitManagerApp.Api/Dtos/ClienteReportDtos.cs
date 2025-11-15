using System;

namespace ProfitManagerApp.Api.Dtos
{
    public record ClienteComprasMensualesDto(
        int Anio,
        int Mes,
        int TotalClientes,
        int TotalVentas,
        decimal MontoTotal
    );

    public record ClienteTopDto(
        int ClienteID,
        int TotalVentas,
        decimal MontoTotal,
        decimal TicketPromedio,
        DateTime UltimaCompra
    );

    public record ClienteInactivoDto(
        int ClienteID,
        int TotalVentas,
        decimal MontoTotal,
        DateTime UltimaCompra,
        int MesesSinCompra
    );

    public record ClienteVentaDetalleDto(
        int VentaID,
        DateTime Fecha,
        decimal SubTotal,
        decimal Descuento,
        decimal Total,
        int CantidadLineas
    );
}
