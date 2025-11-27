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
                v.Estado,
            })
            .FirstOrDefaultAsync(ct);

        if (head is null) return NotFound();

        var detalles = await db.VentaDetalles
            .AsNoTracking()
            .Where(d => d.VentaID == id)
            .Select(d => new VentaDetalleDto
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
                DescuentoLineaPorcentaje = 0m,
                Importe = d.Cantidad * d.PrecioUnitario,
                BodegaID = d.BodegaID
            })
            .ToListAsync(ct);

        string clienteNombre = "Sin cliente asignado";

        if (head.ClienteID.HasValue)
        {
            var cliente = await clientHandler.ObtenerPorIdAsync(head.ClienteID.Value, ct);
            if (cliente is not null)
                clienteNombre = cliente.Nombre;
            else
                clienteNombre = "Nombre no encontrado.";
        }

        var dto = new VentaGetDto
        {
            VentaID = head.VentaID,
            ClienteID = head.ClienteID,
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
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var cliente = await dbOld.Clientes.AsNoTracking()
            .FirstOrDefaultAsync(c => c.CodigoCliente == dto.ClienteCodigo, ct);
        if (cliente is null) return NotFound(new { code = "CLIENT_NOT_FOUND" });

        var skus = dto.Lineas.Select(l => l.Sku.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var productos = await db.Productos.AsNoTracking()
            .Where(p => skus.Contains(p.Sku))
            .ToDictionaryAsync(p => p.Sku, StringComparer.OrdinalIgnoreCase, ct);

        var faltantes = skus.Where(s => !productos.ContainsKey(s)).ToList();
        if (faltantes.Count > 0)
            return ValidationProblem(title: "SKU_NOT_FOUND", detail: string.Join(", ", faltantes));

        var touchPairs = new HashSet<(int ProductoID, int BodegaID)>();
        var lineInfos = new List<(ProductoRow Prod, int BodegaID, decimal Cantidad, decimal DescLineaPct)>();

        foreach (var l in dto.Lineas)
        {
            if (l.Bodega?.Id is null || !int.TryParse(l.Bodega.Id, out var bodId) || bodId <= 0)
                return ValidationProblem(detail: $"Bodega inválida para SKU {l.Sku}");

            var prod = productos[l.Sku];
            var cant = l.Cantidad;
            if (cant <= 0) return ValidationProblem(detail: $"Cantidad inválida para SKU {l.Sku}");

            var d = l.Descuento ?? 0m;
            if (d < 0 || d > 100) return ValidationProblem(detail: $"Descuento inválido para SKU {l.Sku}");

            touchPairs.Add((prod.ProductoID, bodId));
            lineInfos.Add((prod, bodId, cant, d));
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
                return ValidationProblem(
                    title: "NO_ASSIGNMENT",
                    detail: $"Producto {li.Prod.Sku} no asignado a bodega {li.BodegaID}");
        }

        var bodegas = await db.Bodegas.AsNoTracking()
            .Where(b => bodegaIds.Contains(b.BodegaID) && b.IsActive)
            .ToDictionaryAsync(b => b.BodegaID, ct);

        foreach (var li in lineInfos)
        {
            if (!bodegas.ContainsKey(li.BodegaID))
                return ValidationProblem(detail: $"Bodega no válida o inactiva (ID {li.BodegaID})");

            if (!invRows.TryGetValue((li.Prod.ProductoID, li.BodegaID), out var inv))
                return ValidationProblem(
                    title: "NO_ASSIGNMENT",
                    detail: $"Producto {li.Prod.Sku} no asignado a bodega {li.BodegaID}");

            if (inv.Cantidad < li.Cantidad)
                return Problem(
                    title: "INSUFFICIENT_STOCK",
                    detail: $"Stock insuficiente para SKU {li.Prod.Sku} en bodega {li.BodegaID}",
                    statusCode: 409);
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
        var total = baseImponible + impuestoMonto;

        int? createdBy = null;
        var sub = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(sub, out var uid)) createdBy = uid;

        using var trx = await db.Database.BeginTransactionAsync(ct);
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

            foreach (var li in lineInfos)
            {
                var inv = invRows[(li.Prod.ProductoID, li.BodegaID)];
                inv.Cantidad = Math.Round(inv.Cantidad - li.Cantidad, 2, MidpointRounding.AwayFromZero);
                if (inv.Cantidad < 0)
                    return Problem(title: "NEGATIVE_STOCK", detail: "Resultado de stock negativo.", statusCode: 409);
            }

            await db.SaveChangesAsync(ct);
            await trx.CommitAsync(ct);

            return Created($"/api/ventas/{venta.VentaID}", new
            {
                venta.VentaID,
                venta.ClienteID,
                dto.ClienteCodigo,
                venta.Fecha,
                venta.Subtotal,
                venta.Descuento,
                venta.Total
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
        var venta = await db.Ventas.FirstOrDefaultAsync(v => v.VentaID == id, ct);
        if (venta is null) return NotFound();

        if (venta.Estado == EstadoVentaEnum.Anulada)
            return NoContent();

        venta.Estado = EstadoVentaEnum.Anulada;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
