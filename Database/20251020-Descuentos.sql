USE [ProfitUpManagerBD];
GO

SET XACT_ABORT ON;
BEGIN TRAN;

------------------------------------------------------------
-- 1) Agregar DescuentoPorcentaje (0..100), NOT NULL, DEFAULT 0
------------------------------------------------------------
IF COL_LENGTH('dbo.Cliente', 'DescuentoPorcentaje') IS NULL
BEGIN
    ALTER TABLE dbo.Cliente
        ADD DescuentoPorcentaje DECIMAL(5,2) NOT NULL
            CONSTRAINT DF_Cliente_DescuentoPorcentaje DEFAULT (0) WITH VALUES;
END
ELSE
BEGIN
    -- Asegurar NOT NULL
    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID('dbo.Cliente')
          AND name = 'DescuentoPorcentaje'
          AND is_nullable = 1
    )
    BEGIN
        ALTER TABLE dbo.Cliente
            ALTER COLUMN DescuentoPorcentaje DECIMAL(5,2) NOT NULL;
    END

    -- Asegurar DEFAULT 0
    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID('dbo.Cliente')
          AND name = 'DF_Cliente_DescuentoPorcentaje'
    )
    BEGIN
        ALTER TABLE dbo.Cliente
            ADD CONSTRAINT DF_Cliente_DescuentoPorcentaje
            DEFAULT (0) FOR DescuentoPorcentaje;
    END
END
GO

-- Check constraint (0..100)
IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_Cliente_DescuentoPorcentaje_Range'
      AND parent_object_id = OBJECT_ID('dbo.Cliente')
)
BEGIN
    ALTER TABLE dbo.Cliente WITH NOCHECK
        ADD CONSTRAINT CK_Cliente_DescuentoPorcentaje_Range
        CHECK (DescuentoPorcentaje >= 0 AND DescuentoPorcentaje <= 100);
END
GO

------------------------------------------------------------
-- 2) Eliminar tabla ClienteDescuento (no hay datos que migrar)
------------------------------------------------------------
IF OBJECT_ID('dbo.ClienteDescuento', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ClienteDescuento;
END
GO

COMMIT TRAN;
GO


USE [ProfitUpManagerBD];
GO

SET XACT_ABORT ON;
BEGIN TRAN;

------------------------------------------------------------
-- 1) Agregar DescuentoPorcentaje (0..100), NOT NULL, DEFAULT 0
------------------------------------------------------------
IF COL_LENGTH('dbo.Cliente', 'DescuentoPorcentaje') IS NULL
BEGIN
    ALTER TABLE dbo.Cliente
        ADD DescuentoPorcentaje DECIMAL(5,2) NOT NULL
            CONSTRAINT DF_Cliente_DescuentoPorcentaje DEFAULT (0) WITH VALUES;
END
ELSE
BEGIN
    -- Asegurar NOT NULL
    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID('dbo.Cliente')
          AND name = 'DescuentoPorcentaje'
          AND is_nullable = 1
    )
    BEGIN
        ALTER TABLE dbo.Cliente
            ALTER COLUMN DescuentoPorcentaje DECIMAL(5,2) NOT NULL;
    END

    -- Asegurar DEFAULT 0
    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID('dbo.Cliente')
          AND name = 'DF_Cliente_DescuentoPorcentaje'
    )
    BEGIN
        ALTER TABLE dbo.Cliente
            ADD CONSTRAINT DF_Cliente_DescuentoPorcentaje
            DEFAULT (0) FOR DescuentoPorcentaje;
    END
END
GO

-- Check constraint (0..100)
IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_Cliente_DescuentoPorcentaje_Range'
      AND parent_object_id = OBJECT_ID('dbo.Cliente')
)
BEGIN
    ALTER TABLE dbo.Cliente WITH NOCHECK
        ADD CONSTRAINT CK_Cliente_DescuentoPorcentaje_Range
        CHECK (DescuentoPorcentaje >= 0 AND DescuentoPorcentaje <= 100);
END
GO

------------------------------------------------------------
-- 2) Eliminar tabla ClienteDescuento (no hay datos que migrar)
------------------------------------------------------------
IF OBJECT_ID('dbo.ClienteDescuento', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ClienteDescuento;
END
GO

COMMIT TRAN;
GO


 ----
 -- desc
 ---

 ALTER TABLE dbo.Cliente
      ADD DescuentoDescripcion NVARCHAR(200) NULL;
GO