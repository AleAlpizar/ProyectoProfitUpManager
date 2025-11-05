USE ProfitUpManagerBD;
GO

WITH Seeds AS (
    SELECT N'Permiso'      AS Nombre, N'Permisos municipales / sanitarios' AS Descripcion UNION ALL
    SELECT N'Seguro',        N'Pólizas y seguros'                           UNION ALL
    SELECT N'Pago',          N'Pagos recurrentes o facturas'                UNION ALL
    SELECT N'Licencia',      N'Licencias de operación / conducción'         UNION ALL
    SELECT N'Certificado',   N'Certificados varios'                         UNION ALL
    SELECT N'Contrato',      N'Contratos con clientes/proveedores'
)
INSERT INTO dbo.TipoDocumentoVencimiento (Nombre, Descripcion, IsActive)
SELECT s.Nombre, s.Descripcion, 1
FROM Seeds s
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.TipoDocumentoVencimiento t
    WHERE t.Nombre = s.Nombre
);
GO

SELECT TipoDocumentoVencimientoID, Nombre, Descripcion, IsActive
FROM dbo.TipoDocumentoVencimiento
ORDER BY Nombre;
