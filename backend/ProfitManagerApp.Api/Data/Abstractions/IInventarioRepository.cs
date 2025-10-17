using System.Collections.Generic;
using System.Threading.Tasks;
using ProfitManagerApp.Api.Dto;                   
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Domain.Inventory.Dto;

namespace ProfitManagerApp.Data.Abstractions
{
    public interface IInventarioRepository
    {
        Task<bool> PuedeAccederModuloAsync(int usuarioId, string modulo, string accion);

        Task<int> CrearProductoAsync(ProductoCreateDto dto, int? createdBy);

        Task<IEnumerable<StockRowDto>> GetStockAsync(int? productoId, int? bodegaId);

        Task AjusteAsync(AjusteInventarioDto dto, int? usuarioId);

        Task<IEnumerable<BodegaDto>> GetBodegasAsync();   

        Task<IEnumerable<ProductoRowDto>> GetProductosAsync();

        Task<(string Server, string Database, int? ProcId)> DebugDbAsync();

        Task<IEnumerable<UnidadDto>> GetUnidadesAsync();

        Task<(string Server, string Database, int? ProcId)> DebugUnidadesAsync();

        Task<IEnumerable<ProductoMiniDto>> GetProductosMiniAsync();

        Task UpdateProductoAsync(int id, ProductoUpdateDto dto);

        Task<ProductoDetalleDto?> GetProductoDetalleAsync(int productoId);
    }
}
