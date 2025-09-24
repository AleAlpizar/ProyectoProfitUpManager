using ProfitManagerApp.Domain.Inventory.Dto;

namespace ProfitManagerApp.Data.Abstractions
{
    public interface IInventarioRepository
    {
        Task<bool> PuedeAccederModuloAsync(int usuarioId, string modulo, string accion);
        Task<int> CrearProductoAsync(ProductoCreateDto dto, int? createdBy);
        Task<IEnumerable<StockRowDto>> GetStockAsync(int? productoId, int? bodegaId);
        Task AjusteAsync(AjusteInventarioDto dto, int? usuarioId);
    }
}
