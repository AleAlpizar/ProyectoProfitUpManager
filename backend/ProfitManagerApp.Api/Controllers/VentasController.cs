using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Enums;
using ProfitManagerApp.Api.Infrastructure;
using ProfitManagerApp.Api.Models.Rows;
using ProfitManagerApp.Api.Rows;
using ProfitManagerApp.Application.Clientes;
using ProfitManagerApp.Data;

namespace ProfitManagerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador,Vendedor")]
public class VentasController(AppDbContext db, AppDbContextIOld dbOld, ClienteHandler clientHandler) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id, CancellationToken ct)
    {
        var head = await db.Ventas
            .AsNoTracking()
            .Where(v => v.VentaID == id)
            .Select(v => new
            {
                v.VentaID,
                v.ClienteID,
                v.Fecha,
                v.Subtotal,
                v.Descuento,
                v.Total,
                v.Estado
            })
            .FirstOrDefaultAsync(ct);

        if (head is null)
            return NotFound(new { code = "SALE_NOT_FOUND", message = "La venta no fue encontrada." });

        var detalleRows = await db.VentaDetalles
            .AsNoTracking()
            .Where(d => d.VentaID == id)
            .Select(d => new
            {
                d.ProductoID,
                d.Cantidad,
                d.PrecioUnitario,
                d.BodegaID
            })
            .ToListAsync(ct);

        var productoIds = detalleRows
            .Where(d => d.ProductoID.HasValue)
            .Select(d => d.ProductoID!.Value)
            .Distinct()
            .ToList();

        var productosDict = await db.Productos
            .AsNoTracking()
            .Where(p => productoIds.Contains(p.ProductoID))
            .ToDictionaryAsync(
                p => p.ProductoID,
                p => new { p.Sku, p.Nombre },
                ct
            );

        string clienteNombre = "Sin cliente asignado";
        string clienteCodigo = string.Empty;

        if (head.ClienteID.HasValue)
        {
            var cliente = await dbOld.Clientes
                .AsNoTracking()
                .Where(c => c.ClienteID == head.ClienteID.Value)
                .Select(c => new
                {
                    c.Nombre,
                    c.CodigoCliente
                })
                .FirstOrDefaultAsync(ct);

            if (cliente is not null)
            {
                clienteNombre = cliente.Nombre;
                clienteCodigo = cliente.CodigoCliente ?? string.Empty;
            }
            else
            {
                clienteNombre = "Nombre no encontrado.";
            }
        }

        var detalles = detalleRows.Select(d =>
        {
            var sku = string.Empty;
            var descripcion = "—";

            if (d.ProductoID.HasValue && productosDict.TryGetValue(d.ProductoID.Value, out var prod))
            {
                sku = prod.Sku ?? string.Empty;
                descripcion = prod.Nombre ?? "—";
            }

            return new VentaDetalleDto
            {
                ProductoID = d.ProductoID,
                Sku = sku,
                Descripcion = descripcion,
                Cantidad = d.Cantidad,
                PrecioUnitario = d.PrecioUnitario,
                DescuentoLineaPorcentaje = 0m,
                Importe = Math.Round(d.Cantidad * d.PrecioUnitario, 2, MidpointRounding.AwayFromZero),
                BodegaID = d.BodegaID
            };
        }).ToList();

        var dto = new VentaGetDto
        {
            VentaID = head.VentaID,
            ClienteID = head.ClienteID,
            ClienteCodigo = clienteCodigo,
            ClienteNombre = clienteNombre,
            Fecha = head.Fecha,
            Subtotal = head.Subtotal,
            Descuento = head.Descuento,
            Total = head.Total,
            Detalles = detalles,
            Estado = head.Estado
        };

        return Ok(dto);
    }

    [HttpGet("historial")]
    public async Task<ActionResult<VentaHistorialPageDto>> GetHistorial(
        [FromQuery] VentaHistorialFilterDto filter,
        CancellationToken ct)
    {
        if (filter.FechaDesde.HasValue && filter.FechaHasta.HasValue &&
            filter.FechaDesde.Value.Date > filter.FechaHasta.Value.Date)
        {
            ModelState.AddModelError(nameof(filter.FechaDesde), "La fecha desde no puede ser mayor que la fecha hasta.");
        }

        if (filter.TotalMin.HasValue && filter.TotalMax.HasValue &&
            filter.TotalMin.Value > filter.TotalMax.Value)
        {
            ModelState.AddModelError(nameof(filter.TotalMin), "El total mínimo no puede ser mayor que el total máximo.");
        }

        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var page = filter.Page <= 0 ? 1 : filter.Page;
        var pageSize = filter.PageSize <= 0 ? 20 : Math.Min(filter.PageSize, 100);

        var ventasQuery = db.Ventas
            .AsNoTracking()
            .AsQueryable();

        if (filter.FechaDesde.HasValue)
        {
            var desde = filter.FechaDesde.Value.Date;
            ventasQuery = ventasQuery.Where(v => v.Fecha >= desde);
        }

        if (filter.FechaHasta.HasValue)
        {
            var hastaExcl = filter.FechaHasta.Value.Date.AddDays(1);
            ventasQuery = ventasQuery.Where(v => v.Fecha < hastaExcl);
        }

        if (filter.ClienteID.HasValue)
        {
            var cliId = filter.ClienteID.Value;
            ventasQuery = ventasQuery.Where(v => v.ClienteID == cliId);
        }

        if (!string.IsNullOrWhiteSpace(filter.ClienteCodigo))
        {
            var codigo = filter.ClienteCodigo.Trim();

            var clienteIdsPorCodigo = await dbOld.Clientes
                .AsNoTracking()
                .Where(c => c.CodigoCliente == codigo)
                .Select(c => c.ClienteID)
                .ToListAsync(ct);

            if (clienteIdsPorCodigo.Count == 0)
            {
                return Ok(new VentaHistorialPageDto
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalItems = 0,
                    TotalPages = 0,
                    Items = new()
                });
            }

            ventasQuery = ventasQuery.Where(v =>
                v.ClienteID.HasValue && clienteIdsPorCodigo.Contains(v.ClienteID.Value));
        }

        if (filter.Estado.HasValue)
        {
            var estado = filter.Estado.Value;
            ventasQuery = ventasQuery.Where(v => v.Estado == estado);
        }

        if (filter.TotalMin.HasValue)
        {
            var min = filter.TotalMin.Value;
            ventasQuery = ventasQuery.Where(v => v.Total >= min);
        }

        if (filter.TotalMax.HasValue)
        {
            var max = filter.TotalMax.Value;
            ventasQuery = ventasQuery.Where(v => v.Total <= max);
        }

        var totalItems = await ventasQuery.CountAsync(ct);
        var skip = (page - 1) * pageSize;

        var ventasPage = await ventasQuery
            .OrderByDescending(v => v.Fecha)
            .ThenByDescending(v => v.VentaID)
            .Skip(skip)
            .Take(pageSize)
            .Select(v => new
            {
                v.VentaID,
                v.ClienteID,
                v.Fecha,
                v.Subtotal,
                v.Descuento,
                v.Total,
                v.Estado
            })
            .ToListAsync(ct);

        var clienteIdsPagina = ventasPage
            .Where(v => v.ClienteID.HasValue)
            .Select(v => v.ClienteID!.Value)
            .Distinct()
            .ToList();

        var clientesDict = await dbOld.Clientes
            .AsNoTracking()
            .Where(c => clienteIdsPagina.Contains(c.ClienteID))
            .ToDictionaryAsync(c => c.ClienteID, ct);

        var items = ventasPage.Select(v =>
        {
            string nombre = "Sin cliente asignado";
            string codigo = string.Empty;

            if (v.ClienteID.HasValue &&
                clientesDict.TryGetValue(v.ClienteID.Value, out var cli))
            {
                nombre = cli.Nombre;
                codigo = cli.CodigoCliente ?? string.Empty;
            }
            else if (v.ClienteID.HasValue)
            {
                nombre = "Nombre no encontrado.";
            }

            return new VentaHistorialListItemDto
            {
                VentaID = v.VentaID,
                Fecha = v.Fecha,
                ClienteID = v.ClienteID,
                ClienteNombre = nombre,
                ClienteCodigo = codigo,
                Subtotal = v.Subtotal,
                Descuento = v.Descuento,
                Total = v.Total,
                Estado = v.Estado
            };
        }).ToList();

        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pageSize);

        var result = new VentaHistorialPageDto
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
    public async Task<IActionResult> Create([FromBody] VentaFromUiDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        dto.ClienteCodigo = dto.ClienteCodigo?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(dto.ClienteCodigo))
        {
            ModelState.AddModelError(nameof(dto.ClienteCodigo), "El código de cliente es obligatorio.");
            return ValidationProblem(ModelState);
        }

        if (dto.Lineas is null || dto.Lineas.Count == 0)
        {
            ModelState.AddModelError(nameof(dto.Lineas), "Debes agregar al menos una línea de venta.");
            return ValidationProblem(ModelState);
        }

        var cliente = await dbOld.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CodigoCliente == dto.ClienteCodigo, ct);

        if (cliente is null)
        {
            return NotFound(new
            {
                code = "CLIENT_NOT_FOUND",
                message = "No se encontró el cliente seleccionado."
            });
        }

        var normalizedLines = dto.Lineas.Select((l, index) => new
        {
            Index = index,
            Sku = l.Sku?.Trim() ?? string.Empty,
            l.Cantidad,
            Descuento = l.Descuento ?? 0m,
            BodegaIdRaw = l.Bodega?.Id
        }).ToList();

        foreach (var line in normalizedLines)
        {
            if (string.IsNullOrWhiteSpace(line.Sku))
                return ValidationProblem(detail: $"La línea {line.Index + 1} no tiene SKU válido.");

            if (line.Cantidad <= 0)
                return ValidationProblem(detail: $"La cantidad de la línea {line.Index + 1} debe ser mayor que cero.");

            if (line.Descuento < 0 || line.Descuento > 100)
                return ValidationProblem(detail: $"El descuento de la línea {line.Index + 1} debe estar entre 0 y 100.");

            if (string.IsNullOrWhiteSpace(line.BodegaIdRaw) ||
                !int.TryParse(line.BodegaIdRaw, out var bodId) ||
                bodId <= 0)
            {
                return ValidationProblem(detail: $"La bodega de la línea {line.Index + 1} es inválida.");
            }
        }

        var skus = normalizedLines
            .Select(l => l.Sku)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var productos = await db.Productos
            .AsNoTracking()
            .Where(p => skus.Contains(p.Sku))
            .ToDictionaryAsync(p => p.Sku, StringComparer.OrdinalIgnoreCase, ct);

        var faltantes = skus.Where(s => !productos.ContainsKey(s)).ToList();
        if (faltantes.Count > 0)
        {
            return ValidationProblem(
                title: "SKU_NOT_FOUND",
                detail: $"No se encontraron los siguientes SKU: {string.Join(", ", faltantes)}");
        }

        var lineInfos = new List<(ProductoRow Prod, int BodegaID, decimal Cantidad, decimal DescLineaPct)>();

        foreach (var line in normalizedLines)
        {
            var bodId = int.Parse(line.BodegaIdRaw!);
            var prod = productos[line.Sku];

            lineInfos.Add((prod, bodId, line.Cantidad, line.Descuento));
        }

        var productoIds = lineInfos.Select(x => x.Prod.ProductoID).Distinct().ToList();
        var bodegaIds = lineInfos.Select(x => x.BodegaID).Distinct().ToList();

        var invRowsList = await db.Inventarios
            .Where(i => productoIds.Contains(i.ProductoID) && bodegaIds.Contains(i.BodegaID))
            .ToListAsync(ct);

        var invRows = invRowsList.ToDictionary(i => (i.ProductoID, i.BodegaID));

        foreach (var li in lineInfos)
        {
            if (!invRows.ContainsKey((li.Prod.ProductoID, li.BodegaID)))
            {
                return ValidationProblem(
                    title: "NO_ASSIGNMENT",
                    detail: $"El producto {li.Prod.Sku} no está asignado a la bodega {li.BodegaID}.");
            }
        }

        var bodegas = await db.Bodegas
            .AsNoTracking()
            .Where(b => bodegaIds.Contains(b.BodegaID) && b.IsActive)
            .ToDictionaryAsync(b => b.BodegaID, ct);

        foreach (var li in lineInfos)
        {
            if (!bodegas.ContainsKey(li.BodegaID))
            {
                return ValidationProblem(detail: $"La bodega {li.BodegaID} no es válida o está inactiva.");
            }
        }

        var requestedByPair = lineInfos
            .GroupBy(x => (x.Prod.ProductoID, x.BodegaID))
            .ToDictionary(
                g => g.Key,
                g => g.Sum(x => x.Cantidad));

        foreach (var req in requestedByPair)
        {
            if (!invRows.TryGetValue(req.Key, out var inv))
            {
                return ValidationProblem(
                    title: "NO_ASSIGNMENT",
                    detail: $"No existe inventario asignado para el producto {req.Key.ProductoID} en bodega {req.Key.BodegaID}.");
            }

            if (inv.Cantidad < req.Value)
            {
                var prodSku = lineInfos
                    .First(x => x.Prod.ProductoID == req.Key.ProductoID && x.BodegaID == req.Key.BodegaID)
                    .Prod.Sku;

                return Problem(
                    title: "INSUFFICIENT_STOCK",
                    detail: $"Stock insuficiente para SKU {prodSku} en bodega {req.Key.BodegaID}. Disponible: {inv.Cantidad}, solicitado: {req.Value}.",
                    statusCode: 409);
            }
        }

        decimal subtotal = 0m;
        var detalleRows = new List<VentaItemRow>();

        foreach (var li in lineInfos)
        {
            var bruto = li.Cantidad * li.Prod.PrecioVenta;
            var importe = Math.Round(
                bruto * (1 - (li.DescLineaPct / 100m)),
                2,
                MidpointRounding.AwayFromZero);

            subtotal += importe;

            detalleRows.Add(new VentaItemRow
            {
                ProductoID = li.Prod.ProductoID,
                Cantidad = li.Cantidad,
                PrecioUnitario = li.Prod.PrecioVenta,
                BodegaID = li.BodegaID
            });
        }

        subtotal = Math.Round(subtotal, 2, MidpointRounding.AwayFromZero);

        var descClientePct = cliente.DescuentoPorcentaje;
        var descuentoMonto = Math.Round(subtotal * (descClientePct / 100m), 2, MidpointRounding.AwayFromZero);
        var baseImponible = subtotal - descuentoMonto;

        decimal impPct = 0m;
        var impuestoMonto = Math.Round(baseImponible * (impPct / 100m), 2, MidpointRounding.AwayFromZero);
        var total = Math.Round(baseImponible + impuestoMonto, 2, MidpointRounding.AwayFromZero);

        int? createdBy = null;
        var sub = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(sub, out var uid))
            createdBy = uid;

        await using var trx = await db.Database.BeginTransactionAsync(ct);

        try
        {
            var venta = new VentaRow
            {
                ClienteID = cliente.ClienteID,
                Fecha = dto.Fecha ?? DateTime.UtcNow,
                Subtotal = subtotal,
                Descuento = descuentoMonto,
                Total = total,
                Estado = EstadoVentaEnum.Registrada,
                CreatedAt = DateTime.UtcNow,
                UsuarioID = createdBy,
                Detalles = detalleRows
            };

            db.Ventas.Add(venta);

            foreach (var req in requestedByPair)
            {
                var inv = invRows[req.Key];
                inv.Cantidad = Math.Round(inv.Cantidad - req.Value, 2, MidpointRounding.AwayFromZero);

                if (inv.Cantidad < 0)
                {
                    await trx.RollbackAsync(ct);
                    return Problem(
                        title: "NEGATIVE_STOCK",
                        detail: "La operación produciría stock negativo.",
                        statusCode: 409);
                }
            }

            await db.SaveChangesAsync(ct);
            await trx.CommitAsync(ct);

            return Created($"/api/ventas/{venta.VentaID}", new
            {
                ventaID = venta.VentaID,
                clienteID = venta.ClienteID,
                clienteCodigo = dto.ClienteCodigo,
                fecha = venta.Fecha,
                subtotal = venta.Subtotal,
                descuento = venta.Descuento,
                total = venta.Total,
                estado = venta.Estado,
                message = "Venta registrada correctamente."
            });
        }
        catch
        {
            await trx.RollbackAsync(ct);
            throw;
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Anular([FromRoute] int id, CancellationToken ct)
    {
        var venta = await db.Ventas
            .FirstOrDefaultAsync(v => v.VentaID == id, ct);

        if (venta is null)
        {
            return NotFound(new
            {
                code = "SALE_NOT_FOUND",
                message = "La venta no fue encontrada."
            });
        }

        if (venta.Estado == EstadoVentaEnum.Anulada)
        {
            return Ok(new
            {
                ventaID = venta.VentaID,
                message = "La venta ya se encontraba anulada."
            });
        }

        var detalles = await db.VentaDetalles
            .Where(d => d.VentaID == id)
            .ToListAsync(ct);

        await using var trx = await db.Database.BeginTransactionAsync(ct);

        try
        {
            foreach (var det in detalles)
            {
                if (!det.ProductoID.HasValue)
                    continue;

                var inv = await db.Inventarios
                    .FirstOrDefaultAsync(i =>
                        i.ProductoID == det.ProductoID.Value &&
                        i.BodegaID == det.BodegaID, ct);

                if (inv is null)
                {
                    await trx.RollbackAsync(ct);
                    return Problem(
                        title: "INVENTORY_NOT_FOUND",
                        detail: $"No se encontró inventario para producto {det.ProductoID.Value} en bodega {det.BodegaID}.",
                        statusCode: 409);
                }

                inv.Cantidad = Math.Round(inv.Cantidad + det.Cantidad, 2, MidpointRounding.AwayFromZero);
            }

            venta.Estado = EstadoVentaEnum.Anulada;

            await db.SaveChangesAsync(ct);
            await trx.CommitAsync(ct);

            return Ok(new
            {
                ventaID = venta.VentaID,
                message = "Venta anulada correctamente."
            });
        }
        catch
        {
            await trx.RollbackAsync(ct);
            throw;
        }
    }
}