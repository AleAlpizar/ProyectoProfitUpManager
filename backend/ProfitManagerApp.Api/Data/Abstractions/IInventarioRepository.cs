using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Domain.Inventory.Dto;

namespace ProfitManagerApp.Data.Abstractions
{
    public interface IInventarioRepository
    {
        Task<int> CrearProductoAsync(ProductoCreateDto dto, int? userId);
        Task AjusteAsync(AjusteInventarioDto dto, int? userId);
        Task<ProductoDetalleDto?> GetProductoDetalleAsync(int productoId);
        Task UpdateProductoAsync(int id, ProductoUpdateDto dto);

        Task<bool> ExisteProductoAsync(int productoId);
        Task<bool> ExisteBodegaAsync(int bodegaId);
        Task<bool> ExisteAsignacionAsync(int productoId, int bodegaId);
        Task AsignarProductoBodegaAsync(int productoId, int bodegaId);

        Task<decimal> GetCantidadActualAsync(int productoId, int bodegaId);

        Task SetCantidadAbsolutaAsync(InventarioSetCantidadDto dto, int? userId);

        Task InactivarProductoYRetirarStockAsync(int productoId, int? userId);
        Task<IReadOnlyList<ProductoMiniDto>> GetProductosMiniAsync();

    }
}
