using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Enums;
using ProfitManagerApp.Api.Infrastructure;
using ProfitManagerApp.Api.Models.Rows;
using ProfitManagerApp.Data;

namespace ProfitManagerApp.Api.Controllers;

[ApiController]
[Route("api/ordenes-compra")]
[Authorize(Roles = "Administrador,Vendedor")]
public class OrdenesCompraController(AppDbContext db) : ControllerBase
{
    public sealed class CambiarEstadoOrdenCompraDto
    {
        public string Estado { get; set; } = string.Empty;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id, CancellationToken ct)
    {
        var head = await db.OrdenesCompra
            .AsNoTracking()
            .Where(o => o.OrdenCompraID == id)
            .Select(o => new
            {
                o.OrdenCompraID,
                o.CodigoOrden,
                o.ProveedorID,
                o.FechaSolicitud,
                o.FechaEstimada,
                o.Total,
                o.Estado
            })
            .FirstOrDefaultAsync(ct);

        if (head is null) return NotFound();

        var detalles = await db.OrdenCompraItems
            .AsNoTracking()
            .Where(d => d.OrdenCompraID == id)
            .Select(d => new OrdenCompraDetalleDto
            {
                ProductoID = d.ProductoID,
                Sku = db.Productos
                    .Where(p => p.ProductoID == d.ProductoID)
                    .Select(p => p.Sku)
                    .FirstOrDefault() ?? "",
                Descripcion = db.Productos
                    .Where(p => p.ProductoID == d.ProductoID)
                    .Select(p => p.Nombre)
                    .FirstOrDefault() ?? "—",
                Cantidad = d.Cantidad,
                PrecioUnitario = d.PrecioUnitario,
                Importe = d.Cantidad * d.PrecioUnitario
            })
            .ToListAsync(ct);

        var proveedor = await db.Proveedores
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProveedorID == head.ProveedorID, ct);

        var dto = new OrdenCompraGetDto
        {
            OrdenCompraID = head.OrdenCompraID,
            CodigoOrden = head.CodigoOrden,
            ProveedorID = head.ProveedorID,
            ProveedorNombre = proveedor?.Nombre ?? "Proveedor no encontrado",
            FechaSolicitud = head.FechaSolicitud,
            FechaEstimada = head.FechaEstimada,
            Total = head.Total,
            Estado = head.Estado,
            Detalles = detalles,
            Observaciones = null 
        };

        return Ok(dto);
    }

    [HttpGet("historial")]
    public async Task<ActionResult<OrdenCompraHistorialPageDto>> GetHistorial(
        [FromQuery] OrdenCompraHistorialFilterDto filter,
        CancellationToken ct)
    {
        var page = filter.Page <= 0 ? 1 : filter.Page;
        var pageSize = filter.PageSize <= 0 ? 20 : Math.Min(filter.PageSize, 100);

        var query = db.OrdenesCompra
            .AsNoTracking()
            .AsQueryable();

        if (filter.FechaDesde.HasValue)
        {
            var desde = filter.FechaDesde.Value.Date;
            query = query.Where(o => o.FechaSolicitud >= desde);
        }

        if (filter.FechaHasta.HasValue)
        {
            var hastaExcl = filter.FechaHasta.Value.Date.AddDays(1);
            query = query.Where(o => o.FechaSolicitud < hastaExcl);
        }

        if (filter.ProveedorID.HasValue)
        {
            var provId = filter.ProveedorID.Value;
            query = query.Where(o => o.ProveedorID == provId);
        }

        if (!string.IsNullOrWhiteSpace(filter.ProveedorNombre))
        {
            var nombre = filter.ProveedorNombre.Trim();

            var proveedorIds = await db.Proveedores
                .AsNoTracking()
                .Where(p => p.Nombre.Contains(nombre))
                .Select(p => p.ProveedorID)
                .ToListAsync(ct);

            if (proveedorIds.Count == 0)
            {
                return Ok(new OrdenCompraHistorialPageDto
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalItems = 0,
                    TotalPages = 0,
                    Items = new()
                });
            }

            query = query.Where(o => proveedorIds.Contains(o.ProveedorID));
        }

        if (filter.Estado.HasValue)
        {
            var estado = filter.Estado.Value;
            query = query.Where(o => o.Estado == estado);
        }

        if (filter.TotalMin.HasValue)
        {
            var min = filter.TotalMin.Value;
            query = query.Where(o => o.Total >= min);
        }

        if (filter.TotalMax.HasValue)
        {
            var max = filter.TotalMax.Value;
            query = query.Where(o => o.Total <= max);
        }

        var totalItems = await query.CountAsync(ct);

        var skip = (page - 1) * pageSize;

        var ordenesPage = await query
            .OrderByDescending(o => o.FechaSolicitud)
            .ThenByDescending(o => o.OrdenCompraID)
            .Skip(skip)
            .Take(pageSize)
            .Select(o => new
            {
                o.OrdenCompraID,
                o.ProveedorID,
                o.FechaSolicitud,
                o.Total,
                o.Estado
            })
            .ToListAsync(ct);

        var proveedorIdsPagina = ordenesPage
            .Select(o => o.ProveedorID)
            .Distinct()
            .ToList();

        var proveedoresDict = await db.Proveedores
            .AsNoTracking()
            .Where(p => proveedorIdsPagina.Contains(p.ProveedorID))
            .ToDictionaryAsync(p => p.ProveedorID, ct);

        var items = ordenesPage.Select(o =>
        {
            string nombre = "Proveedor no encontrado";

            if (proveedoresDict.TryGetValue(o.ProveedorID, out var prov))
            {
                nombre = prov.Nombre;
            }

            return new OrdenCompraHistorialListItemDto
            {
                OrdenCompraID = o.OrdenCompraID,
                FechaSolicitud = o.FechaSolicitud,
                ProveedorID = o.ProveedorID,
                ProveedorNombre = nombre,
                Total = o.Total,
                Estado = o.Estado
            };
        }).ToList();

        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pageSize);

        var result = new OrdenCompraHistorialPageDto
        {
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
            Items = items
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OrdenCompraFromUiDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var proveedor = await db.Proveedores
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProveedorID == dto.ProveedorID && p.IsActive, ct);

        if (proveedor is null)
            return NotFound(new { code = "SUPPLIER_NOT_FOUND" });

        var skus = dto.Lineas
            .Select(l => l.Sku.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var productos = await db.Productos.AsNoTracking()
            .Where(p => skus.Contains(p.Sku))
            .ToDictionaryAsync(p => p.Sku!, StringComparer.OrdinalIgnoreCase, ct);

        var faltantes = skus.Where(s => !productos.ContainsKey(s)).ToList();
        if (faltantes.Count > 0)
            return ValidationProblem(title: "SKU_NOT_FOUND", detail: string.Join(", ", faltantes));

        decimal total = 0m;
        var detalleRows = new List<OrdenCompraItemRow>();

        foreach (var linea in dto.Lineas)
        {
            if (!productos.TryGetValue(linea.Sku, out var prod))
                return ValidationProblem(detail: $"Producto no encontrado para SKU {linea.Sku}");

            if (linea.Cantidad <= 0)
                return ValidationProblem(detail: $"Cantidad inválida para SKU {linea.Sku}");

            decimal unitPrice;

            if (linea.PrecioUnitario.HasValue)
            {
                if (linea.PrecioUnitario.Value <= 0)
                    return ValidationProblem(detail: $"Precio inválido para SKU {linea.Sku}");

                unitPrice = linea.PrecioUnitario.Value;
            }
            else
            {
                if (!prod.PrecioCosto.HasValue || prod.PrecioCosto.Value <= 0)
                    return ValidationProblem(detail: $"Precio no definido para SKU {linea.Sku}");

                unitPrice = prod.PrecioCosto.Value;
            }

            var bruto = linea.Cantidad * unitPrice;
            var importe = Math.Round(bruto, 2, MidpointRounding.AwayFromZero);
            total += importe;

            detalleRows.Add(new OrdenCompraItemRow
            {
                ProductoID = prod.ProductoID,
                Cantidad = linea.Cantidad,
                PrecioUnitario = unitPrice
            });
        }

        total = Math.Round(total, 2, MidpointRounding.AwayFromZero);

        int? createdBy = null;
        var sub = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(sub, out var uid)) createdBy = uid;

        using var trx = await db.Database.BeginTransactionAsync(ct);
        try
        {
            var orden = new OrdenCompraRow
            {
                ProveedorID = proveedor.ProveedorID,
                FechaSolicitud = dto.FechaSolicitud ?? DateTime.UtcNow,
                FechaEstimada = dto.FechaEstimada,
                Estado = EstadoOrdenCompraEnum.Pendiente,
                Total = total,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = createdBy,
                Detalles = detalleRows
            };

            db.OrdenesCompra.Add(orden);

            await db.SaveChangesAsync(ct);
            await trx.CommitAsync(ct);

            return Created($"/api/ordenes-compra/{orden.OrdenCompraID}", new
            {
                orden.OrdenCompraID,
                orden.ProveedorID,
                ProveedorNombre = proveedor.Nombre,
                orden.FechaSolicitud,
                orden.Total
            });
        }
        catch
        {
            await trx.RollbackAsync(ct);
            throw;
        }
    }

    [HttpPut("{id:int}/estado")]
    public async Task<IActionResult> CambiarEstado(
        [FromRoute] int id,
        [FromBody] CambiarEstadoOrdenCompraDto dto,
        CancellationToken ct)
    {
        var orden = await db.OrdenesCompra
            .FirstOrDefaultAsync(o => o.OrdenCompraID == id, ct);

        if (orden is null)
            return NotFound();

        if (orden.Estado is EstadoOrdenCompraEnum.Anulada or EstadoOrdenCompraEnum.Hecha)
            return BadRequest("La orden ya no se puede modificar.");

        if (string.IsNullOrWhiteSpace(dto.Estado))
            return BadRequest("Estado requerido.");

        if (!Enum.TryParse<EstadoOrdenCompraEnum>(dto.Estado, ignoreCase: true, out var nuevoEstado))
            return BadRequest("Estado no válido.");

        orden.Estado = nuevoEstado;
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Anular([FromRoute] int id, CancellationToken ct)
    {
        var orden = await db.OrdenesCompra.FirstOrDefaultAsync(o => o.OrdenCompraID == id, ct);
        if (orden is null) return NotFound();

        if (orden.Estado == EstadoOrdenCompraEnum.Hecha)
            return BadRequest("No se puede anular una orden marcada como Hecha.");

        if (orden.Estado == EstadoOrdenCompraEnum.Anulada)
            return NoContent();

        orden.Estado = EstadoOrdenCompraEnum.Anulada;
        await db.SaveChangesAsync(ct);

        return NoContent();
    }
}
