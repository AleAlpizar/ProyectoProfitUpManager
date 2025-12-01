using Microsoft.EntityFrameworkCore;
using ProfitManagerApp.Api.Enums;
using ProfitManagerApp.Api.Models.Rows;
using ProfitManagerApp.Api.Rows;

namespace ProfitManagerApp.Api.Infrastructure
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<BodegaRow> Bodegas => Set<BodegaRow>();
        public DbSet<UnidadAlmacenamientoRow> Unidades => Set<UnidadAlmacenamientoRow>();
        public DbSet<ProductoRow> Productos => Set<ProductoRow>();
        public DbSet<InventarioRow> Inventarios => Set<InventarioRow>();

        public DbSet<VentaRow> Ventas => Set<VentaRow>();
        public DbSet<VentaItemRow> VentaDetalles => Set<VentaItemRow>();
        public DbSet<VentaAnulacionRow> VentaAnulaciones => Set<VentaAnulacionRow>();

        public DbSet<MovimientoInventarioRow> MovimientosInventario => Set<MovimientoInventarioRow>();

        public DbSet<ProveedorRow> Proveedores => Set<ProveedorRow>();
        public DbSet<OrdenCompraRow> OrdenesCompra => Set<OrdenCompraRow>();
        public DbSet<OrdenCompraItemRow> OrdenCompraItems => Set<OrdenCompraItemRow>();

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

                e.Property(x => x.PrecioVenta).HasPrecision(18, 2);
            });

            modelBuilder.Entity<InventarioRow>(e =>
            {
                e.ToTable("Inventario", "dbo");
                e.HasKey(x => x.InventarioID);
                e.Property(x => x.InventarioID).ValueGeneratedOnAdd();

                e.Property(x => x.Cantidad).HasPrecision(18, 4);

                e.HasIndex(x => new { x.ProductoID, x.BodegaID }).IsUnique();
            });

            modelBuilder.Entity<VentaRow>(e =>
            {
                e.ToTable("Venta", "dbo");
                e.HasKey(x => x.VentaID);
                e.Property(x => x.VentaID).ValueGeneratedOnAdd();

                e.Property(x => x.ClienteID);
                e.Property(x => x.Fecha).IsRequired();

                e.Property(x => x.Subtotal).HasPrecision(18, 2);
                e.Property(x => x.Descuento).HasPrecision(18, 2);
                e.Property(x => x.Total).HasPrecision(18, 2);

                e.Property(x => x.CreatedAt).IsRequired();
                e.Property(x => x.UsuarioID);

                e.HasIndex(x => x.Fecha);

                e.Property(x => x.Estado)
                    .HasConversion<string>()
                    .HasMaxLength(20)
                    .HasDefaultValue(EstadoVentaEnum.Registrada);
            });

            modelBuilder.Entity<VentaItemRow>(e =>
            {
                e.ToTable("VentaItem", "dbo");
                e.HasKey(x => x.VentaItemID);
                e.Property(x => x.VentaItemID).ValueGeneratedOnAdd();

                e.Property(x => x.VentaID).IsRequired();
                e.Property(x => x.ProductoID);
                e.Property(x => x.BodegaID).IsRequired();

                e.Property(x => x.Cantidad).HasPrecision(18, 4);
                e.Property(x => x.PrecioUnitario).HasPrecision(18, 4);

                e.HasOne(x => x.Venta)
                    .WithMany(v => v.Detalles)
                    .HasForeignKey(x => x.VentaID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<VentaAnulacionRow>(e =>
            {
                e.ToTable("VentaAnulacion", "dbo");
                e.HasKey(x => x.AnulacionID);
                e.Property(x => x.AnulacionID).ValueGeneratedOnAdd();

                e.Property(x => x.Motivo).HasMaxLength(500);
                e.Property(x => x.FechaAnulacion).IsRequired();
                e.Property(x => x.UsuarioID);

                e.HasOne(x => x.Venta)
                    .WithMany()
                    .HasForeignKey(x => x.VentaID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<MovimientoInventarioRow>(e =>
            {
                e.ToTable("MovimientoInventario", "dbo");
                e.HasKey(x => x.MovimientoID);
                e.Property(x => x.MovimientoID).ValueGeneratedOnAdd();

                e.Property(x => x.TipoMovimiento).IsRequired().HasMaxLength(50);
                e.Property(x => x.Cantidad).HasPrecision(18, 4);
                e.Property(x => x.ReferenciaTipo).HasMaxLength(100);
                e.Property(x => x.Motivo).HasMaxLength(250);
                e.Property(x => x.FechaMovimiento).IsRequired();
            });

            modelBuilder.Entity<ProveedorRow>(e =>
            {
                e.ToTable("Proveedor", "dbo");
                e.HasKey(x => x.ProveedorID);
                e.Property(x => x.ProveedorID).ValueGeneratedOnAdd();

                e.Property(x => x.Nombre).IsRequired().HasMaxLength(200);
                e.Property(x => x.Contacto).HasMaxLength(150);
                e.Property(x => x.Telefono).HasMaxLength(50);
                e.Property(x => x.Correo).HasMaxLength(200);
                e.Property(x => x.Direccion).HasMaxLength(300);
                e.Property(x => x.IsActive).HasDefaultValue(true);
            });

            modelBuilder.Entity<OrdenCompraRow>(e =>
            {
                e.ToTable("OrdenCompra", "dbo");
                e.HasKey(x => x.OrdenCompraID);
                e.Property(x => x.OrdenCompraID).ValueGeneratedOnAdd();

                e.Property(x => x.CodigoOrden).HasMaxLength(100);

                e.Property(x => x.ProveedorID).IsRequired();

                e.Property(x => x.FechaSolicitud).IsRequired();
                e.Property(x => x.FechaEstimada);

                e.Property(x => x.Total).HasPrecision(18, 2);

                e.Property(x => x.CreatedAt).IsRequired();
                e.Property(x => x.CreatedBy);

                e.Property(x => x.Estado)
                    .HasConversion<string>()
                    .HasMaxLength(50)
                    .HasDefaultValue(EstadoOrdenCompraEnum.Pendiente);

                e.HasMany(x => x.Detalles)
                    .WithOne(d => d.Orden)
                    .HasForeignKey(d => d.OrdenCompraID)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            modelBuilder.Entity<OrdenCompraItemRow>(e =>
            {
                e.ToTable("OrdenCompraItem", "dbo");
                e.HasKey(x => x.OrdenCompraItemID);
                e.Property(x => x.OrdenCompraItemID).ValueGeneratedOnAdd();

                e.Property(x => x.OrdenCompraID).IsRequired();
                e.Property(x => x.ProductoID).IsRequired();

                e.Property(x => x.Cantidad).HasPrecision(18, 4);
                e.Property(x => x.PrecioUnitario).HasPrecision(18, 4);
            });
        }
    }
}
