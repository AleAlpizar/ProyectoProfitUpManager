namespace ProfitManagerApp.Api.Dtos
{
    public record ClienteComprasMensualesDto(
        int Anio,
        int Mes,
        int TotalClientes,
        int TotalVentas,
        decimal MontoTotal
    );
}
