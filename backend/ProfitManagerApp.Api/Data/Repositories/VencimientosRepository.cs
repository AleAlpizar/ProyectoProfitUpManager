using Dapper;
using Microsoft.Data.SqlClient;
using ProfitManagerApp.Api.Data.Abstractions;
using ProfitManagerApp.Api.Dtos;
using System.Data;

namespace ProfitManagerApp.Data
{
    public sealed class VencimientosRepository : IVencimientosRepository
    {
        private readonly string _cs;
        public VencimientosRepository(IConfiguration cfg)
        {
            _cs = cfg.GetConnectionString("Default")
               ?? throw new InvalidOperationException("Connection string 'Default' no configurada.");
        }

        public async Task<int> CreateAsync(VencimientoUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Titulo))
                throw new ArgumentException("El título es obligatorio.");
            if (dto.FechaVencimiento == default)
                throw new ArgumentException("La fecha de vencimiento es obligatoria.");

            const string sqlCheckTipo = @"
SELECT COUNT(1)
FROM dbo.TipoDocumentoVencimiento
WHERE TipoDocumentoVencimientoID = @Tipo AND IsActive = 1;";

            const string sqlInsert = @"
INSERT INTO dbo.DocumentoVencimiento
    (Titulo, Descripcion, TipoDocumentoVencimientoID, Referencia, FechaEmision,
     FechaVencimiento, NotificarDiasAntes, IsActive, CreatedAt)
VALUES
    (@Titulo, @Descripcion, @TipoDocumentoVencimientoID, @Referencia, @FechaEmision,
     @FechaVencimiento, @NotificarDiasAntes, @IsActive, SYSUTCDATETIME());
SELECT CAST(SCOPE_IDENTITY() AS int);";

            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            using var tx = await cn.BeginTransactionAsync(IsolationLevel.ReadCommitted);

            var tipoOk = await cn.ExecuteScalarAsync<int>(sqlCheckTipo,
                new { Tipo = dto.TipoDocumentoVencimientoID }, tx);
            if (tipoOk == 0)
            {
                await tx.RollbackAsync();
                throw new ArgumentException("Tipo de documento inválido o inactivo.");
            }

            var newId = await cn.ExecuteScalarAsync<int>(sqlInsert, new
            {
                dto.Titulo,
                dto.Descripcion,
                dto.TipoDocumentoVencimientoID,
                dto.Referencia,
                dto.FechaEmision,
                dto.FechaVencimiento,
                dto.NotificarDiasAntes,
                dto.IsActive
            }, tx);

            await tx.CommitAsync();
            return newId;
        }

        public async Task<VencimientoDetalleDto?> GetByIdAsync(int id)
        {
            const string sql = @"
SELECT
  dv.DocumentoVencimientoID,
  dv.Titulo,
  dv.Descripcion,
  dv.TipoDocumentoVencimientoID,
  tdv.Nombre AS TipoNombre,
  dv.Referencia,
  dv.FechaEmision,
  dv.FechaVencimiento,
  dv.NotificarDiasAntes,
  dv.IsActive
FROM dbo.DocumentoVencimiento dv
JOIN dbo.TipoDocumentoVencimiento tdv
  ON tdv.TipoDocumentoVencimientoID = dv.TipoDocumentoVencimientoID
WHERE dv.DocumentoVencimientoID = @id;";

            await using var cn = new SqlConnection(_cs);
            return await cn.QueryFirstOrDefaultAsync<VencimientoDetalleDto>(sql, new { id });
        }

        public async Task UpdateAsync(int id, VencimientoUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Titulo))
                throw new ArgumentException("El título es obligatorio.");
            if (dto.FechaVencimiento == default)
                throw new ArgumentException("La fecha de vencimiento es obligatoria.");

            const string sqlCheckTipo = @"
SELECT COUNT(1)
FROM dbo.TipoDocumentoVencimiento
WHERE TipoDocumentoVencimientoID = @Tipo AND IsActive = 1;";

            const string sqlUpdate = @"
UPDATE dbo.DocumentoVencimiento
SET Titulo = @Titulo,
    Descripcion = @Descripcion,
    TipoDocumentoVencimientoID = @TipoDocumentoVencimientoID,
    Referencia = @Referencia,
    FechaEmision = @FechaEmision,
    FechaVencimiento = @FechaVencimiento,
    NotificarDiasAntes = @NotificarDiasAntes,
    IsActive = @IsActive
WHERE DocumentoVencimientoID = @Id;";

            await using var cn = new SqlConnection(_cs);
            await cn.OpenAsync();

            using var tx = await cn.BeginTransactionAsync(IsolationLevel.ReadCommitted);

            var tipoOk = await cn.ExecuteScalarAsync<int>(sqlCheckTipo, new { Tipo = dto.TipoDocumentoVencimientoID }, tx);
            if (tipoOk == 0)
            {
                await tx.RollbackAsync();
                throw new ArgumentException("Tipo de documento inválido.");
            }

            var rows = await cn.ExecuteAsync(sqlUpdate, new
            {
                Id = id,
                dto.Titulo,
                dto.Descripcion,
                dto.TipoDocumentoVencimientoID,
                dto.Referencia,
                dto.FechaEmision,
                dto.FechaVencimiento,
                dto.NotificarDiasAntes,
                dto.IsActive
            }, tx);

            if (rows == 0)
            {
                await tx.RollbackAsync();
                throw new KeyNotFoundException("Documento no encontrado.");
            }

            await tx.CommitAsync();
        }

        public async Task<IReadOnlyList<VencimientoRowDto>> ListCalendarioAsync(DateTime? desde, DateTime? hasta, bool soloPendientes)
        {
            const string sql = @"
DECLARE @Hoy DATE = CAST(GETUTCDATE() AS DATE);

WITH base AS (
  SELECT
    dv.DocumentoVencimientoID,
    dv.Titulo,
    dv.Descripcion,
    dv.TipoDocumentoVencimientoID,
    tdv.Nombre AS TipoNombre,
    dv.Referencia,
    dv.FechaEmision,
    dv.FechaVencimiento,
    dv.NotificarDiasAntes,
    dv.IsActive,
    DATEDIFF(DAY, @Hoy, CAST(dv.FechaVencimiento AS DATE)) AS DaysToDue
  FROM dbo.DocumentoVencimiento dv
  JOIN dbo.TipoDocumentoVencimiento tdv ON tdv.TipoDocumentoVencimientoID = dv.TipoDocumentoVencimientoID
  WHERE dv.IsActive = 1
    AND (@Desde IS NULL OR dv.FechaVencimiento >= @Desde)
    AND (@Hasta IS NULL  OR dv.FechaVencimiento <  @Hasta)
),
calc AS (
  SELECT *,
         CASE
           WHEN DaysToDue < 0 THEN 'VENCIDO'
           WHEN DaysToDue BETWEEN 0 AND ISNULL(NotificarDiasAntes, 7) THEN 'PROXIMO'
           ELSE 'VIGENTE'
         END AS Estado
  FROM base
)
SELECT
  DocumentoVencimientoID,
  Titulo,
  Descripcion,
  TipoDocumentoVencimientoID,
  TipoNombre,
  Referencia,
  FechaEmision,
  FechaVencimiento,
  NotificarDiasAntes,
  DaysToDue,
  Estado
FROM calc
WHERE (@SoloPendientes = 0) OR (Estado IN ('VENCIDO','PROXIMO'))
ORDER BY FechaVencimiento ASC, Titulo ASC;";

            await using var cn = new SqlConnection(_cs);
            var rows = await cn.QueryAsync<VencimientoRowDto>(sql, new
            {
                Desde = (object?)desde ?? DBNull.Value,
                Hasta = (object?)hasta ?? DBNull.Value,
                SoloPendientes = soloPendientes ? 1 : 0
            });
            return rows.ToList();
        }

        public async Task<IReadOnlyList<AlertRowDto>> ListAlertasPendientesAsync(int umbralDefault = 7)
        {
            const string sql = @"
DECLARE @Hoy DATE = CAST(GETUTCDATE() AS DATE);

SELECT
  dv.DocumentoVencimientoID,
  dv.Titulo,
  tdv.Nombre AS TipoNombre,
  dv.Referencia,
  dv.FechaVencimiento,
  dv.NotificarDiasAntes,
  DATEDIFF(DAY, @Hoy, CAST(dv.FechaVencimiento AS DATE)) AS DaysToDue,
  CASE
    WHEN DATEDIFF(DAY, @Hoy, CAST(dv.FechaVencimiento AS DATE)) < 0 THEN 'VENCIDO'
    WHEN DATEDIFF(DAY, @Hoy, CAST(dv.FechaVencimiento AS DATE)) BETWEEN 0 AND ISNULL(dv.NotificarDiasAntes, @UmbralDefault) THEN 'PROXIMO'
    ELSE 'VIGENTE'
  END AS Estado
FROM dbo.DocumentoVencimiento dv
JOIN dbo.TipoDocumentoVencimiento tdv ON tdv.TipoDocumentoVencimientoID = dv.TipoDocumentoVencimientoID
WHERE dv.IsActive = 1
  AND (
    DATEDIFF(DAY, @Hoy, CAST(dv.FechaVencimiento AS DATE)) < 0
    OR DATEDIFF(DAY, @Hoy, CAST(dv.FechaVencimiento AS DATE)) BETWEEN 0 AND ISNULL(dv.NotificarDiasAntes, @UmbralDefault)
  )
ORDER BY dv.FechaVencimiento ASC, dv.Titulo ASC;";

            await using var cn = new SqlConnection(_cs);
            var rows = await cn.QueryAsync<AlertRowDto>(sql, new { UmbralDefault = umbralDefault });
            return rows.ToList();
        }

        public async Task<IReadOnlyList<TipoDocumentoVtoDto>> ListTiposActivosAsync()
        {
            const string sql = @"
SELECT
  TipoDocumentoVencimientoID,
  Nombre,
  Descripcion,
  IsActive
FROM dbo.TipoDocumentoVencimiento
WHERE IsActive = 1
ORDER BY Nombre;";

            await using var cn = new SqlConnection(_cs);
            var rows = await cn.QueryAsync<TipoDocumentoVtoDto>(sql);
            return rows.ToList();
        }

        public async Task DeleteAsync(int id)
        {
            const string sql = @"
UPDATE dbo.DocumentoVencimiento
   SET IsActive = 0, UpdatedAt = SYSUTCDATETIME()
 WHERE DocumentoVencimientoID = @Id AND IsActive = 1;";

            await using var cn = new SqlConnection(_cs);
            var rows = await cn.ExecuteAsync(sql, new { Id = id });

            if (rows == 0)
                throw new KeyNotFoundException("Documento no encontrado o ya inactivo.");
        }
    }
}
