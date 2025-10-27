using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Models.Rows;

namespace ProfitManagerApp.Api.Infrastructure;

public static class AppDbSeedExtensions
{
    public static async Task EnsureSeedUnidadesAsync(this AppDbContext db)
    {
        await db.Database.MigrateAsync();

        if (!await db.Unidades.AnyAsync())
        {
            db.Unidades.AddRange(
                new UnidadAlmacenamientoRow { Codigo = "UNI", Nombre = "Unidad", Activo = true },
                new UnidadAlmacenamientoRow { Codigo = "CAJ", Nombre = "Caja", Activo = true }
            );
            await db.SaveChangesAsync();
        }
    }
}
