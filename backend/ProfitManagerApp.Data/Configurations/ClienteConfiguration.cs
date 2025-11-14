using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProfitManagerApp.Data.Rows;

namespace ProfitManagerApp.Data.Configurations;

public class ClienteRowConfiguration : IEntityTypeConfiguration<ClienteRow>
{
  public void Configure(EntityTypeBuilder<ClienteRow> b)
  {
    b.ToTable("Cliente");
    b.HasKey(x => x.ClienteID);
    b.Property(x => x.ClienteID).ValueGeneratedOnAdd();

    b.Property(x => x.CodigoCliente).HasMaxLength(50);
    b.HasIndex(x => x.CodigoCliente).IsUnique(); 

    b.Property(x => x.Nombre).IsRequired().HasMaxLength(200);
    b.Property(x => x.TipoPersona).IsRequired().HasMaxLength(20).HasDefaultValue("Natural");
    b.Property(x => x.Identificacion).HasMaxLength(50);
    b.Property(x => x.Correo).HasMaxLength(200);
    b.Property(x => x.Telefono).HasMaxLength(50);
    b.Property(x => x.Direccion).HasMaxLength(300);

    b.Property(x => x.FechaRegistro)
        .HasColumnType("datetime2")
        .ValueGeneratedOnAdd()
        .HasDefaultValueSql("sysutcdatetime()");

    b.Property(x => x.IsActive).HasDefaultValue(true);

    b.Property(x => x.CreatedAt)
        .HasColumnType("datetime2")
        .ValueGeneratedOnAdd()
        .HasDefaultValueSql("sysutcdatetime()");

    b.Property(x => x.DescuentoPorcentaje)
       .HasPrecision(5, 2)
       .HasDefaultValue(0);

    b.Property(x => x.DescuentoDescripcion)
      .HasDefaultValue("");
  }
}
