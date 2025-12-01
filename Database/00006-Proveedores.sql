
USE ProfitUpManagerBD;
GO


CREATE OR ALTER PROCEDURE dbo.usp_Proveedor_List
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ProveedorID,
        Nombre,
        Contacto,
        Telefono,
        Correo
    FROM dbo.Proveedor
    WHERE IsActive = 1
    ORDER BY Nombre;
END
GO


IF NOT EXISTS (SELECT 1 FROM dbo.Proveedor WHERE Nombre = 'Viñedos San Marcos')
INSERT INTO dbo.Proveedor (Nombre, Contacto, Telefono, Correo, Direccion, IsActive)
VALUES ('Viñedos San Marcos', 'Laura González', '(506) 2222-1111', 'contacto@sanmarcos.cr', 'San Ramón, Alajuela', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Proveedor WHERE Nombre = 'Distribuidora Enoteca')
INSERT INTO dbo.Proveedor (Nombre, Contacto, Telefono, Correo, Direccion, IsActive)
VALUES ('Distribuidora Enoteca', 'Carlos Méndez', '(506) 2233-2222', 'ventas@enoteca.cr', 'Escazú, San José', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Proveedor WHERE Nombre = 'Bodega del Valle')
INSERT INTO dbo.Proveedor (Nombre, Contacto, Telefono, Correo, Direccion, IsActive)
VALUES ('Bodega del Valle', 'María Rodríguez', '(506) 2444-3333', 'info@bodegadelvalle.cr', 'Grecia, Alajuela', 1);
GO



DECLARE @ConstraintName sysname;

SELECT @ConstraintName = kc.name
FROM sys.key_constraints kc
WHERE kc.parent_object_id = OBJECT_ID('dbo.OrdenCompra')
  AND kc.[type] = 'U';  

IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @sql nvarchar(400);
    SET @sql = N'ALTER TABLE dbo.OrdenCompra DROP CONSTRAINT [' + @ConstraintName + N']';
    EXEC sp_executesql @sql;
END
GO


CREATE UNIQUE INDEX UX_OrdenCompra_CodigoOrden
ON dbo.OrdenCompra(CodigoOrden)
WHERE CodigoOrden IS NOT NULL;
GO

ALTER TABLE dbo.OrdenCompra
DROP CONSTRAINT [UQ__OrdenCom__1B9107A405A5F323];
GO


SELECT kc.name, kc.type_desc
FROM sys.key_constraints kc
WHERE kc.parent_object_id = OBJECT_ID('dbo.OrdenCompra');

CREATE UNIQUE INDEX UX_OrdenCompra_CodigoOrden_NN
ON dbo.OrdenCompra (CodigoOrden)
WHERE CodigoOrden IS NOT NULL;
GO
