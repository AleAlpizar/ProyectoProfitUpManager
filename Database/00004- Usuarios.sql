USE ProfitUpManagerBD;
GO
----------------------
-- Crear la columna
IF COL_LENGTH('dbo.Usuario','EstadoUsuario') IS NULL
BEGIN
    PRINT('> Agregando columna EstadoUsuario...');
    ALTER TABLE dbo.Usuario ADD EstadoUsuario NVARCHAR(10) NULL; 

    DECLARE @sql NVARCHAR(MAX);

    SET @sql = N'
        UPDATE dbo.Usuario
           SET EstadoUsuario = CASE WHEN IsActive = 1 THEN ''ACTIVE'' ELSE ''PAUSED'' END
         WHERE EstadoUsuario IS NULL;
    ';
    EXEC sp_executesql @sql;

    SET @sql = N'ALTER TABLE dbo.Usuario ALTER COLUMN EstadoUsuario NVARCHAR(10) NOT NULL;';
    EXEC sp_executesql @sql;
END
ELSE
BEGIN
    PRINT('> La columna EstadoUsuario ya existe. Normalizando valores...');
    UPDATE dbo.Usuario
       SET EstadoUsuario = COALESCE(EstadoUsuario, CASE WHEN IsActive = 1 THEN 'ACTIVE' ELSE 'PAUSED' END);
END
GO
-----------------------

---------------------
IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_Usuario_EstadoUsuario'
      AND parent_object_id = OBJECT_ID('dbo.Usuario')
)
BEGIN
    ALTER TABLE dbo.Usuario WITH CHECK
      ADD CONSTRAINT CK_Usuario_EstadoUsuario
      CHECK (EstadoUsuario IN ('ACTIVE','PAUSED','VACATION'));
END
GO
----------------------



------------------
IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.Usuario')
      AND name = 'DF_Usuario_EstadoUsuario'
)
BEGIN
    ALTER TABLE dbo.Usuario
      ADD CONSTRAINT DF_Usuario_EstadoUsuario
      DEFAULT('ACTIVE') FOR EstadoUsuario;
END
GO
-------------------






SELECT TOP 10 UsuarioID, Nombre, IsActive, EstadoUsuario
FROM dbo.Usuario
ORDER BY UsuarioID DESC;
GO
