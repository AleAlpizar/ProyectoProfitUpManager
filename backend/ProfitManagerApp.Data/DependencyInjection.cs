using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ProfitManagerApp.Data;

public static class DependencyInjection
{
    public static IServiceCollection AddProfitManagerData(this IServiceCollection services, IConfiguration cfg)
    {
        var cs = cfg.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default no configurado");

        services.AddDbContext<AppDbContextIOld>(opt =>
        {
            opt.UseSqlServer(cs, sql => sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null));
        });

        return services;
    }
}
