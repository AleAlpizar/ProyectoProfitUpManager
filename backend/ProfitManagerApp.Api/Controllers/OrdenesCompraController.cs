using System.ComponentModel.DataAnnotations;
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
        [Required(ErrorMessage = "El estado es requerido.")]
        [StringLength(20)]
        public string Estado { get; set; } = string.Empty;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id, CancellationToken ct)
    {
        if (id <= 0)
            return BadRequest(new { message = "El identificador de la orden es inválido." });

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

        if (head is null)
            return NotFound(new { message = "La orden de compra no fue encontrada." });

        var detallesRaw = await db.OrdenCompraItems
            .AsNoTracking()
            .Where(d => d.OrdenCompraID == id)
            .Select(d => new
            {
                d.ProductoID,
                d.Cantidad,
                d.PrecioUnitario
            })
            .ToListAsync(ct);

        var productoIds = detallesRaw
            .Select(d => d.ProductoID)
            .Distinct()
            .ToList();

        var productosDict = await db.Productos
            .AsNoTracking()
            .Where(p => productoIds.Contains(p.ProductoID))
            .ToDictionaryAsync(
                p => p.ProductoID,
                p => new { p.Sku, p.Nombre },
                ct);

        var detalles = detallesRaw
            .Select(d =>
            {
                productosDict.TryGetValue(d.ProductoID, out var producto);

                return new OrdenCompraDetalleDto
                {
                    ProductoID = d.ProductoID,
                    Sku = producto?.Sku ?? "",
                    Descripcion = producto?.Nombre ?? "—",
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    Importe = Math.Round(d.Cantidad * d.PrecioUnitario, 2, MidpointRounding.AwayFromZero)
                };
            })
            .ToList();

        var proveedorNombre = await db.Proveedores
            .AsNoTracking()
            .Where(p => p.ProveedorID == head.ProveedorID)
            .Select(p => p.Nombre)
            .FirstOrDefaultAsync(ct);

        var dto = new OrdenCompraGetDto
        {
            OrdenCompraID = head.OrdenCompraID,
            CodigoOrden = head.CodigoOrden,
            ProveedorID = head.ProveedorID,
            ProveedorNombre = proveedorNombre ?? "Proveedor no encontrado",
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

        if (filter.FechaDesde.HasValue && filter.FechaHasta.HasValue &&
            filter.FechaDesde.Value.Date > filter.FechaHasta.Value.Date)
        {
            return BadRequest(new
            {
                message = "La fecha desde no puede ser mayor que la fecha hasta."
            });
        }

        if (filter.TotalMin.HasValue && filter.TotalMax.HasValue &&
            filter.TotalMin.Value > filter.TotalMax.Value)
        {
            return BadRequest(new
            {
                message = "El total mínimo no puede ser mayor que el total máximo."
            });
        }

        var query = db.OrdenesCompra
            .AsNoTracking()
            .AsQueryable();

        if (filter.OrdenCompraID.HasValue)
        {
            var ordenCompraId = filter.OrdenCompraID.Value;
            query = query.Where(o => o.OrdenCompraID == ordenCompraId);
        }

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
                .Where(p => EF.Functions.Like(p.Nombre, $"%{nombre}%"))
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
            .ToDictionaryAsync(p => p.ProveedorID, p => p.Nombre, ct);

        var items = ordenesPage.Select(o =>
        {
            var nombreProveedor = proveedoresDict.TryGetValue(o.ProveedorID, out var nombre)
                ? nombre
                : "Proveedor no encontrado";

            return new OrdenCompraHistorialListItemDto
            {
                OrdenCompraID = o.OrdenCompraID,
                FechaSolicitud = o.FechaSolicitud,
                ProveedorID = o.ProveedorID,
                ProveedorNombre = nombreProveedor,
                Total = o.Total,
                Estado = o.Estado
            };
        }).ToList();

        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pageSize);

        return Ok(new OrdenCompraHistorialPageDto
        {
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
            Items = items
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OrdenCompraFromUiDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (dto.Lineas is null || dto.Lineas.Count == 0)
        {
            return BadRequest(new
            {
                message = "Debe incluir al menos una línea para registrar la orden."
            });
        }

        var proveedor = await db.Proveedores
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProveedorID == dto.ProveedorID && p.IsActive, ct);

        if (proveedor is null)
        {
            return NotFound(new
            {
                code = "SUPPLIER_NOT_FOUND",
                message = "El proveedor indicado no existe o está inactivo."
            });
        }

        var fechaSolicitud = dto.FechaSolicitud ?? DateTime.UtcNow;
        var fechaEstimada = dto.FechaEstimada;

        if (fechaEstimada.HasValue && fechaEstimada.Value.Date < fechaSolicitud.Date)
        {
            return BadRequest(new
            {
                message = "La fecha estimada no puede ser menor que la fecha de solicitud."
            });
        }

        var lineasNormalizadas = dto.Lineas
            .Select((l, index) => new
            {
                Index = index + 1,
                Sku = (l.Sku ?? string.Empty).Trim(),
                l.Cantidad,
                l.PrecioUnitario
            })
            .ToList();

        var lineasConSkuVacio = lineasNormalizadas
            .Where(x => string.IsNullOrWhiteSpace(x.Sku))
            .Select(x => x.Index)
            .ToList();

        if (lineasConSkuVacio.Count > 0)
        {
            return BadRequest(new
            {
                message = $"Hay líneas sin SKU válido: {string.Join(", ", lineasConSkuVacio)}."
            });
        }

        var skusDuplicados = lineasNormalizadas
            .GroupBy(x => x.Sku, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .OrderBy(x => x)
            .ToList();

        if (skusDuplicados.Count > 0)
        {
            return BadRequest(new
            {
                message = $"No se permiten productos repetidos en la misma orden. SKU duplicados: {string.Join(", ", skusDuplicados)}."
            });
        }

        var skus = lineasNormalizadas
            .Select(l => l.Sku)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var productos = await db.Productos
            .AsNoTracking()
            .Where(p => skus.Contains(p.Sku!))
            .ToDictionaryAsync(p => p.Sku!, StringComparer.OrdinalIgnoreCase, ct);

        var faltantes = skus
            .Where(s => !productos.ContainsKey(s))
            .OrderBy(s => s)
            .ToList();

        if (faltantes.Count > 0)
        {
            return BadRequest(new
            {
                code = "SKU_NOT_FOUND",
                message = $"No se encontraron los siguientes SKU: {string.Join(", ", faltantes)}."
            });
        }

        decimal total = 0m;
        var detalleRows = new List<OrdenCompraItemRow>();

        foreach (var linea in lineasNormalizadas)
        {
            if (!productos.TryGetValue(linea.Sku, out var prod))
            {
                return BadRequest(new
                {
                    message = $"No se encontró el producto correspondiente al SKU {linea.Sku}."
                });
            }

            if (linea.Cantidad <= 0)
            {
                return BadRequest(new
                {
                    message = $"La cantidad debe ser mayor a 0 para el SKU {linea.Sku}."
                });
            }

            decimal unitPrice;

            if (linea.PrecioUnitario.HasValue)
            {
                if (linea.PrecioUnitario.Value <= 0)
                {
                    return BadRequest(new
                    {
                        message = $"El precio unitario debe ser mayor a 0 para el SKU {linea.Sku}."
                    });
                }

                unitPrice = Math.Round(linea.PrecioUnitario.Value, 2, MidpointRounding.AwayFromZero);
            }
            else
            {
                if (!prod.PrecioCosto.HasValue || prod.PrecioCosto.Value <= 0)
                {
                    return BadRequest(new
                    {
                        message = $"El producto con SKU {linea.Sku} no tiene un precio de costo válido."
                    });
                }

                unitPrice = Math.Round(prod.PrecioCosto.Value, 2, MidpointRounding.AwayFromZero);
            }

            var importe = Math.Round(linea.Cantidad * unitPrice, 2, MidpointRounding.AwayFromZero);
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
        if (int.TryParse(sub, out var uid))
        {
            createdBy = uid;
        }

        await using var trx = await db.Database.BeginTransactionAsync(ct);

        try
        {
            var orden = new OrdenCompraRow
            {
                ProveedorID = proveedor.ProveedorID,
                FechaSolicitud = fechaSolicitud,
                FechaEstimada = fechaEstimada,
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
                message = "La orden de compra fue registrada correctamente.",
                orden.OrdenCompraID,
                orden.ProveedorID,
                ProveedorNombre = proveedor.Nombre,
                orden.FechaSolicitud,
                orden.FechaEstimada,
                orden.Total,
                Estado = orden.Estado.ToString()
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
        if (id <= 0)
            return BadRequest(new { message = "El identificador de la orden es inválido." });

        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var orden = await db.OrdenesCompra
            .FirstOrDefaultAsync(o => o.OrdenCompraID == id, ct);

        if (orden is null)
            return NotFound(new { message = "La orden de compra no fue encontrada." });

        if (orden.Estado is EstadoOrdenCompraEnum.Anulada or EstadoOrdenCompraEnum.Hecha)
        {
            return BadRequest(new
            {
                message = "La orden ya no se puede modificar porque se encuentra en un estado final."
            });
        }

        if (!Enum.TryParse<EstadoOrdenCompraEnum>(dto.Estado.Trim(), ignoreCase: true, out var nuevoEstado))
        {
            return BadRequest(new
            {
                message = "El estado indicado no es válido."
            });
        }

        if (nuevoEstado == EstadoOrdenCompraEnum.Pendiente)
        {
            return BadRequest(new
            {
                message = "Solo se permite cambiar la orden a Hecha o Anulada."
            });
        }

        if (orden.Estado == nuevoEstado)
        {
            return Ok(new
            {
                message = "La orden ya se encuentra en el estado solicitado.",
                ordenCompraID = orden.OrdenCompraID,
                estado = orden.Estado.ToString()
            });
        }

        orden.Estado = nuevoEstado;
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "El estado de la orden fue actualizado correctamente.",
            ordenCompraID = orden.OrdenCompraID,
            estado = orden.Estado.ToString()
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Anular([FromRoute] int id, CancellationToken ct)
    {
        if (id <= 0)
            return BadRequest(new { message = "El identificador de la orden es inválido." });

        var orden = await db.OrdenesCompra
            .FirstOrDefaultAsync(o => o.OrdenCompraID == id, ct);

        if (orden is null)
        {
            return NotFound(new
            {
                message = "La orden de compra no fue encontrada."
            });
        }

        if (orden.Estado == EstadoOrdenCompraEnum.Hecha)
        {
            return BadRequest(new
            {
                message = "No se puede anular una orden marcada como Hecha."
            });
        }

        if (orden.Estado == EstadoOrdenCompraEnum.Anulada)
        {
            return Ok(new
            {
                message = "La orden ya se encontraba anulada.",
                ordenCompraID = orden.OrdenCompraID,
                estado = orden.Estado.ToString()
            });
        }

        orden.Estado = EstadoOrdenCompraEnum.Anulada;
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "La orden fue anulada correctamente.",
            ordenCompraID = orden.OrdenCompraID,
            estado = orden.Estado.ToString()
        });
    }
}