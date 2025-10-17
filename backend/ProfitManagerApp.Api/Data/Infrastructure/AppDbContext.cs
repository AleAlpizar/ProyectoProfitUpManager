using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Models;

namespace ProfitManagerApp.Api.Infrastructure
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Bodega> Bodegas => Set<Bodega>();
        public DbSet<UnidadAlmacenamiento> Unidades => Set<UnidadAlmacenamiento>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Bodega>(e =>
            {
                e.ToTable("Bodega", "dbo");
                e.HasKey(x => x.BodegaID);
                e.Property(x => x.BodegaID).ValueGeneratedOnAdd();
                e.Property(x => x.Codigo).HasMaxLength(50);
                e.HasIndex(x => x.Codigo).IsUnique();
                e.Property(x => x.Nombre).IsRequired().HasMaxLength(150);
                e.Property(x => x.Direccion).HasMaxLength(300);
                e.Property(x => x.Contacto).HasMaxLength(150);
                e.Property(x => x.IsActive).HasDefaultValue(true);
                e.Property(x => x.CreatedAt);
            });

            modelBuilder.Entity<UnidadAlmacenamiento>(e =>
            {
                e.ToTable("UnidadAlmacenamiento", "dbo");
                e.HasKey(x => x.UnidadID);
                e.Property(x => x.UnidadID).ValueGeneratedOnAdd();
                e.Property(x => x.Codigo).IsRequired().HasMaxLength(10);
                e.HasIndex(x => x.Codigo).IsUnique();
                e.Property(x => x.Nombre).IsRequired().HasMaxLength(100);
                e.Property(x => x.Activo).HasDefaultValue(true);
            });
        }
    }
}
