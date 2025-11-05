using ProfitManagerApp.Api.Dtos;

namespace ProfitManagerApp.Api.Data.Abstractions
{
    public interface IVencimientosRepository
    {
        Task<int> CreateAsync(VencimientoUpdateDto dto); 

        Task<VencimientoDetalleDto?> GetByIdAsync(int id);
        Task UpdateAsync(int id, VencimientoUpdateDto dto);
        Task<IReadOnlyList<VencimientoRowDto>> ListCalendarioAsync(DateTime? desde, DateTime? hasta, bool soloPendientes);
        Task<IReadOnlyList<AlertRowDto>> ListAlertasPendientesAsync(int umbralDefault = 7);
        Task<IReadOnlyList<TipoDocumentoVtoDto>> ListTiposActivosAsync();
    }
}
