using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Models.Rows;

namespace ProfitManagerApp.Api.Infrastructure
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<BodegaRow> Bodegas => Set<BodegaRow>();
        public DbSet<UnidadAlmacenamientoRow> Unidades => Set<UnidadAlmacenamientoRow>();
        public DbSet<ProductoRow> Productos => Set<ProductoRow>();
        public DbSet<InventarioRow> Inventarios => Set<InventarioRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BodegaRow>(e =>
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

        modelBuilder.Entity<UnidadAlmacenamientoRow>(e =>
        {
            e.ToTable("UnidadAlmacenamiento", "dbo");
            e.HasKey(x => x.UnidadID);
            e.Property(x => x.UnidadID).ValueGeneratedOnAdd();
            e.Property(x => x.Codigo).IsRequired().HasMaxLength(10);
            e.HasIndex(x => x.Codigo).IsUnique();
            e.Property(x => x.Nombre).IsRequired().HasMaxLength(100);
            e.Property(x => x.Activo).HasDefaultValue(true);
        });

        modelBuilder.Entity<ProductoRow>(e =>
        {
          e.ToTable("Producto", "dbo");
          e.HasKey(x => x.ProductoID);
          e.Property(x => x.ProductoID).ValueGeneratedOnAdd();
          e.Property(x => x.Sku).IsRequired().HasMaxLength(50);
          e.HasIndex(x => x.Sku).IsUnique();
          e.Property(x => x.Nombre).IsRequired().HasMaxLength(200);
          e.Property(x => x.IsActive).HasDefaultValue(true);
          e.Property(x => x.PrecioUnitario).HasPrecision(18, 2);
          e.Property(x => x.ImpuestoPorcentaje).HasPrecision(5, 2);
        });

        modelBuilder.Entity<InventarioRow>(e =>
        {
          e.ToTable("Inventario", "dbo");
          e.HasKey(x => x.InventarioID);
          e.Property(x => x.InventarioID).ValueGeneratedOnAdd();
          e.Property(x => x.Cantidad).HasPrecision(18, 2);
          e.HasIndex(x => new { x.ProductoID, x.BodegaID }).IsUnique();
        });
      }
    }
}
