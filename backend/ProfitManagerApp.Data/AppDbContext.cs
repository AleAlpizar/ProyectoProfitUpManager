using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Data.Rows;

namespace ProfitManagerApp.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : DbContext(options)
{
  public DbSet<ClienteRow> Clientes => Set<ClienteRow>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    base.OnModelCreating(modelBuilder);
  }
}
