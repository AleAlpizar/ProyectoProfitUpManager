using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Data.Rows;

namespace ProfitManagerApp.Data;

public class AppDbContextIOld(DbContextOptions<AppDbContextIOld> options)
    : DbContext(options)
{
  public DbSet<ClienteRow> Clientes => Set<ClienteRow>();


  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContextIOld).Assembly);

    base.OnModelCreating(modelBuilder);
  }
}
