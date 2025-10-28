using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Infrastructure;
using ProfitManagerApp.Api.Models;
using ProfitManagerApp.Api.Models.Rows;
using ProfitManagerApp.Data;
using System.Security.Claims;

namespace ProfitManagerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VentasController(AppDbContext db, AppDbContextIOld dbOld) : ControllerBase
{
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] VentaFromUiDto dto, CancellationToken ct)
  {
    if (!ModelState.IsValid) return ValidationProblem(ModelState);

    var cliente = await dbOld.Clientes.AsNoTracking()
        .FirstOrDefaultAsync(c => c.CodigoCliente == dto.ClienteCodigo, ct);
    if (cliente is null) return NotFound(new { code = "CLIENT_NOT_FOUND" });

    // Cargar productos por SKU
    var skus = dto.Lineas.Select(l => l.Sku.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    var productos = await db.Productos.AsNoTracking()
        .Where(p => skus.Contains(p.Sku))
        .ToDictionaryAsync(p => p.Sku, StringComparer.OrdinalIgnoreCase, ct);

    var faltantes = skus.Where(s => !productos.ContainsKey(s)).ToList();
    if (faltantes.Count > 0)
      return ValidationProblem(title: "SKU_NOT_FOUND", detail: string.Join(", ", faltantes));

    // Parsear bodegas y agrupar inventarios a tocar (ProductoID, BodegaID)
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

    // 1) Llaves simples para que EF las traduzca
    var productoIds = lineInfos.Select(x => x.Prod.ProductoID).Distinct().ToList();
    var bodegaIds = lineInfos.Select(x => x.BodegaID).Distinct().ToList();

    // 2) Trae inventarios con "productoIds.Contains" y "bodegaIds.Contains"
    var invRowsList = await db.Inventarios
        .Where(i => productoIds.Contains(i.ProductoID) && bodegaIds.Contains(i.BodegaID))
        .ToListAsync(ct);

    // 3) Diccionario por par (ProductoID, BodegaID)
    var invRows = invRowsList.ToDictionary(i => (i.ProductoID, i.BodegaID));

    // 4) (Opcional pero útil) Validar que exista exactamente la asignación esperada por cada línea
    foreach (var li in lineInfos)
    {
      if (!invRows.ContainsKey((li.Prod.ProductoID, li.BodegaID)))
        return ValidationProblem(title: "NO_ASSIGNMENT",
            detail: $"Producto {li.Prod.Sku} no asignado a bodega {li.BodegaID}");
    }


    // Validar bodegas existen y stock suficiente
    var bodegas = await db.Bodegas.AsNoTracking()
        .Where(b => bodegaIds.Contains(b.BodegaID) && b.IsActive)
        .ToDictionaryAsync(b => b.BodegaID, ct);

    foreach (var li in lineInfos)
    {
      if (!bodegas.ContainsKey(li.BodegaID))
        return ValidationProblem(detail: $"Bodega no válida o inactiva (ID {li.BodegaID})");

      if (!invRows.TryGetValue((li.Prod.ProductoID, li.BodegaID), out var inv))
        return ValidationProblem(title: "NO_ASSIGNMENT", detail: $"Producto {li.Prod.Sku} no asignado a bodega {li.BodegaID}");

      if (inv.Cantidad < li.Cantidad)
        return Problem(title: "INSUFFICIENT_STOCK", detail: $"Stock insuficiente para SKU {li.Prod.Sku} en bodega {li.BodegaID}", statusCode: 409);
    }

    // Cálculos
    decimal subtotal = 0m;
    var detalleRows = new List<VentaItemRow>();
    foreach (var li in lineInfos)
    {
      var bruto = li.Cantidad * li.Prod.PrecioVenta;
      var importe = Math.Round(bruto * (1 - (li.DescLineaPct / 100m)), 2, MidpointRounding.AwayFromZero);
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

    // Descuento global por cliente (si lo usas)
    var descClientePct = cliente.DescuentoPorcentaje; // DECIMAL(5,2) 0..100
    var descuentoMonto = Math.Round(subtotal * (descClientePct / 100m), 2, MidpointRounding.AwayFromZero);
    var baseImponible = subtotal - descuentoMonto;

    // Impuesto global simple (ajusta si usas por producto)
    decimal impPct = 0m;
    var impuestoMonto = Math.Round(baseImponible * (impPct / 100m), 2, MidpointRounding.AwayFromZero);
    var total = baseImponible + impuestoMonto;

    int? createdBy = null;
    var sub = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (int.TryParse(sub, out var uid)) createdBy = uid;

    using var trx = await db.Database.BeginTransactionAsync(ct);
    try
    {
      // Insert venta
      var venta = new VentaRow
      {
        ClienteID = cliente.ClienteID,
        Fecha = dto.Fecha ?? DateTime.UtcNow,
        Subtotal = subtotal,
        Descuento = descuentoMonto,
        //ImpuestoPorcentaje = impPct,
        //ImpuestoMonto = impuestoMonto,
        Total = total,
        //Observaciones = string.IsNullOrWhiteSpace(dto.Observaciones) ? null : dto.Observaciones.Trim(),
        //IsActive = true,
        CreatedAt = DateTime.UtcNow,
        //CreatedBy = createdBy,
        Detalles = detalleRows
      };

      db.Ventas.Add(venta);

      // Descargar inventario por línea
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
        //venta.ImpuestoPorcentaje,
        //venta.ImpuestoMonto,
        venta.Total
      });
    }
    catch
    {
      await trx.RollbackAsync(ct);
      throw;
    }
  }
}
