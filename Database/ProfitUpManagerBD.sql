IF DB_ID(N'ProfitUpManagerBD') IS NULL
BEGIN
    CREATE DATABASE ProfitUpManagerBD;
END
GO

USE ProfitUpManagerBD;
GO

-- Lookup
CREATE TABLE dbo.TipoDocumentoVencimiento (
    TipoDocumentoVencimientoID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(250) NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.UnidadAlmacenamiento (
    UnidadID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL,
    FactorDecimal DECIMAL(18,6) NOT NULL DEFAULT 1
);
GO

-- Roles
CREATE TABLE dbo.Rol (
    RolID INT IDENTITY(1,1) PRIMARY KEY,
    NombreRol NVARCHAR(50) NOT NULL UNIQUE,
    Descripcion NVARCHAR(250) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.Usuario (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NULL,
    Correo NVARCHAR(200) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(512) NOT NULL,
    Salt NVARCHAR(100) NULL,
    Telefono NVARCHAR(50) NULL,
    FechaRegistro DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    LastLogin DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME2 NULL,
    UpdatedBy INT NULL
);
GO

CREATE TABLE dbo.UsuarioRol (
    UsuarioRolID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL,
    RolID INT NOT NULL,
    AssignedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    AssignedBy INT NULL,
    CONSTRAINT FK_UsuarioRol_Usuario FOREIGN KEY (UsuarioID) REFERENCES dbo.Usuario(UsuarioID),
    CONSTRAINT FK_UsuarioRol_Rol FOREIGN KEY (RolID) REFERENCES dbo.Rol(RolID),
    CONSTRAINT UQ_UsuarioRol UNIQUE (UsuarioID, RolID)
);
GO

CREATE TABLE dbo.Sesion (
    SesionID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioID INT NOT NULL,
    Token NVARCHAR(512) NOT NULL,
    DeviceInfo NVARCHAR(500) NULL,
    IP NVARCHAR(50) NULL,
    ExpireAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Sesion_Usuario FOREIGN KEY (UsuarioID) REFERENCES dbo.Usuario(UsuarioID)
);
GO

CREATE TABLE dbo.PasswordReset (
    PasswordResetID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioID INT NOT NULL,
    Token NVARCHAR(512) NOT NULL,
    ExpireAt DATETIME2 NOT NULL,
    Used BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_PasswordReset_Usuario FOREIGN KEY (UsuarioID) REFERENCES dbo.Usuario(UsuarioID)
);
GO

--Clientes
CREATE TABLE dbo.Cliente (
    ClienteID INT IDENTITY(1,1) PRIMARY KEY,
    CodigoCliente NVARCHAR(50) NULL UNIQUE,
    Nombre NVARCHAR(200) NOT NULL,
    TipoPersona NVARCHAR(20) NOT NULL DEFAULT 'Natural',
    Identificacion NVARCHAR(50) NULL,
    Correo NVARCHAR(200) NULL,
    Telefono NVARCHAR(50) NULL,
    Direccion NVARCHAR(300) NULL,
    FechaRegistro DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME2 NULL,
    UpdatedBy INT NULL
);
GO

CREATE TABLE dbo.FidelidadPrograma (
    FidelidadID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(400) NULL,
    ReglaPuntos NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.ClienteFidelidad (
    ClienteFidelidadID INT IDENTITY(1,1) PRIMARY KEY,
    ClienteID INT NOT NULL,
    FidelidadID INT NOT NULL,
    Puntos DECIMAL(18,2) NOT NULL DEFAULT 0,
    Nivel NVARCHAR(50) NULL,
    CONSTRAINT FK_ClienteFidelidad_Cliente FOREIGN KEY (ClienteID) REFERENCES dbo.Cliente(ClienteID),
    CONSTRAINT FK_ClienteFidelidad_Fidelidad FOREIGN KEY (FidelidadID) REFERENCES dbo.FidelidadPrograma(FidelidadID),
    CONSTRAINT UQ_ClienteFidelidad UNIQUE (ClienteID, FidelidadID)
);
GO

CREATE TABLE dbo.ClienteDescuento (
    ClienteDescuentoID INT IDENTITY(1,1) PRIMARY KEY,
    ClienteID INT NOT NULL,
    Porcentaje DECIMAL(5,2) NULL,
    MontoFijo DECIMAL(18,2) NULL,
    FechaInicio DATETIME2 NULL,
    FechaFin DATETIME2 NULL,
    Motivo NVARCHAR(250) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_ClienteDescuento_Cliente FOREIGN KEY (ClienteID) REFERENCES dbo.Cliente(ClienteID)
);
GO

CREATE TABLE dbo.ClienteActividad (
    ClienteActividadID INT IDENTITY(1,1) PRIMARY KEY,
    ClienteID INT NOT NULL,
    TipoActividad NVARCHAR(100) NULL,
    Detalle NVARCHAR(MAX) NULL,
    Fecha DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UsuarioID INT NULL,
    CONSTRAINT FK_ClienteActividad_Cliente FOREIGN KEY (ClienteID) REFERENCES dbo.Cliente(ClienteID)
);
GO

--Vencimientos
CREATE TABLE dbo.DocumentoVencimiento (
    DocumentoVencimientoID INT IDENTITY(1,1) PRIMARY KEY,
    Titulo NVARCHAR(200) NOT NULL,
    Descripcion NVARCHAR(400) NULL,
    TipoDocumentoVencimientoID INT NOT NULL,
    Referencia NVARCHAR(200) NULL,
    FechaEmision DATETIME2 NULL,
    FechaVencimiento DATETIME2 NOT NULL,
    NotificarDiasAntes INT NOT NULL DEFAULT 7,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME2 NULL,
    UpdatedBy INT NULL,
    CONSTRAINT FK_DocumentoVencimiento_Tipo FOREIGN KEY (TipoDocumentoVencimientoID) REFERENCES dbo.TipoDocumentoVencimiento(TipoDocumentoVencimientoID)
);
GO

-- Inventario
CREATE TABLE dbo.Bodega (
    BodegaID INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(50) NULL UNIQUE,
    Nombre NVARCHAR(150) NOT NULL,
    Direccion NVARCHAR(300) NULL,
    Contacto NVARCHAR(150) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.Producto (
    ProductoID INT IDENTITY(1,1) PRIMARY KEY,
    SKU NVARCHAR(100) NULL UNIQUE,
    Nombre NVARCHAR(250) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    CodigoInterno NVARCHAR(100) NULL,
    Peso DECIMAL(18,4) NULL,
    Largo DECIMAL(18,4) NULL,
    Alto DECIMAL(18,4) NULL,
    Ancho DECIMAL(18,4) NULL,
    UnidadAlmacenamientoID INT NULL,
    PrecioCosto DECIMAL(18,2) NULL,
    PrecioVenta DECIMAL(18,2) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME2 NULL,
    UpdatedBy INT NULL,
    CONSTRAINT FK_Producto_Unidad FOREIGN KEY (UnidadAlmacenamientoID) REFERENCES dbo.UnidadAlmacenamiento(UnidadID)
);
GO

CREATE TABLE dbo.Inventario (
    InventarioID INT IDENTITY(1,1) PRIMARY KEY,
    ProductoID INT NOT NULL,
    BodegaID INT NOT NULL,
    Cantidad DECIMAL(18,4) NOT NULL DEFAULT 0,
    CantidadReservada DECIMAL(18,4) NOT NULL DEFAULT 0,
    FechaUltimaActualizacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Inventario_Producto FOREIGN KEY (ProductoID) REFERENCES dbo.Producto(ProductoID),
    CONSTRAINT FK_Inventario_Bodega FOREIGN KEY (BodegaID) REFERENCES dbo.Bodega(BodegaID),
    CONSTRAINT UQ_Inventario UNIQUE (ProductoID, BodegaID)
);
GO

CREATE TABLE dbo.MovimientoInventario (
    MovimientoID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ProductoID INT NOT NULL,
    BodegaID INT NOT NULL,
    TipoMovimiento NVARCHAR(50) NOT NULL,
    Cantidad DECIMAL(18,4) NOT NULL,
    ReferenciaTipo NVARCHAR(100) NULL,
    Motivo NVARCHAR(250) NULL,
    FechaMovimiento DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UsuarioID INT NULL,
    CONSTRAINT FK_MovInv_Producto FOREIGN KEY (ProductoID) REFERENCES dbo.Producto(ProductoID),
    CONSTRAINT FK_MovInv_Bodega FOREIGN KEY (BodegaID) REFERENCES dbo.Bodega(BodegaID)
);
GO

-- Proveedores y Compras
CREATE TABLE dbo.Proveedor (
    ProveedorID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(200) NOT NULL,
    Contacto NVARCHAR(150) NULL,
    Telefono NVARCHAR(50) NULL,
    Correo NVARCHAR(200) NULL,
    Direccion NVARCHAR(300) NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.OrdenCompra (
    OrdenCompraID INT IDENTITY(1,1) PRIMARY KEY,
    CodigoOrden NVARCHAR(100) NULL UNIQUE,
    ProveedorID INT NOT NULL,
    FechaSolicitud DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FechaEstimada DATETIME2 NULL,
    Estado NVARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    Total DECIMAL(18,2) NOT NULL DEFAULT 0,
    CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_OrdenCompra_Proveedor FOREIGN KEY (ProveedorID) REFERENCES dbo.Proveedor(ProveedorID)
);
GO

CREATE TABLE dbo.OrdenCompraItem (
    OrdenCompraItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrdenCompraID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad DECIMAL(18,4) NOT NULL,
    PrecioUnitario DECIMAL(18,4) NOT NULL,
    SubTotal AS (Cantidad * PrecioUnitario) PERSISTED,
    CONSTRAINT FK_OCItem_Orden FOREIGN KEY (OrdenCompraID) REFERENCES dbo.OrdenCompra(OrdenCompraID),
    CONSTRAINT FK_OCItem_Producto FOREIGN KEY (ProductoID) REFERENCES dbo.Producto(ProductoID)
);
GO

-- Ventas
CREATE TABLE dbo.Venta (
    VentaID INT IDENTITY(1,1) PRIMARY KEY,
    CodigoVenta NVARCHAR(100) NULL UNIQUE,
    Fecha DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ClienteID INT NULL,
    UsuarioID INT NULL,
    Estado NVARCHAR(50) NOT NULL DEFAULT 'Registrada',
    SubTotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    Descuento DECIMAL(18,2) NOT NULL DEFAULT 0,
    Total DECIMAL(18,2) NOT NULL DEFAULT 0,
    MedioPago NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Venta_Cliente FOREIGN KEY (ClienteID) REFERENCES dbo.Cliente(ClienteID)
);
GO

CREATE TABLE dbo.VentaItem (
    VentaItemID INT IDENTITY(1,1) PRIMARY KEY,
    VentaID INT NOT NULL,
    ProductoID INT NOT NULL,
    BodegaID INT NOT NULL,
    Cantidad DECIMAL(18,4) NOT NULL,
    PrecioUnitario DECIMAL(18,4) NOT NULL,
    SubTotal AS (Cantidad * PrecioUnitario) PERSISTED,
    CONSTRAINT FK_VentaItem_Venta FOREIGN KEY (VentaID) REFERENCES dbo.Venta(VentaID),
    CONSTRAINT FK_VentaItem_Producto FOREIGN KEY (ProductoID) REFERENCES dbo.Producto(ProductoID),
    CONSTRAINT FK_VentaItem_Bodega FOREIGN KEY (BodegaID) REFERENCES dbo.Bodega(BodegaID)
);
GO

CREATE TABLE dbo.VentaAnulacion (
    AnulacionID INT IDENTITY(1,1) PRIMARY KEY,
    VentaID INT NOT NULL,
    Motivo NVARCHAR(500) NULL,
    FechaAnulacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UsuarioID INT NULL,
    CONSTRAINT FK_VentaAnulacion_Venta FOREIGN KEY (VentaID) REFERENCES dbo.Venta(VentaID)
);
GO

-- Reportes
CREATE TABLE dbo.ReporteHistorial (
    ReporteHistorialID INT IDENTITY(1,1) PRIMARY KEY,
    NombreReporte NVARCHAR(250) NOT NULL,
    Parametros NVARCHAR(MAX) NULL,
    UsuarioID INT NULL,
    FechaGeneracion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.ReporteExport (
    ReporteExportID INT IDENTITY(1,1) PRIMARY KEY,
    ReporteHistorialID INT NOT NULL,
    Formato NVARCHAR(20) NOT NULL,
    ArchivoRuta NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ReporteExport_Hist FOREIGN KEY (ReporteHistorialID) REFERENCES dbo.ReporteHistorial(ReporteHistorialID)
);
GO

-- Errores
CREATE TABLE dbo.BitacoraErrores (
    ErrorID BIGINT IDENTITY(1,1) PRIMARY KEY,
    Nivel NVARCHAR(50) NULL,
    Mensaje NVARCHAR(MAX) NULL,
    StackTrace NVARCHAR(MAX) NULL,
    Origen NVARCHAR(200) NULL,
    Fecha DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UsuarioID INT NULL
);
GO

-- Checks
ALTER TABLE dbo.Venta ADD CONSTRAINT CHK_Venta_TotalNonNegative CHECK (Total >= 0);
ALTER TABLE dbo.Inventario ADD CONSTRAINT CHK_Inventario_CantidadNonNegative CHECK (Cantidad >= 0);
GO




-------------------------------Usuario-------------------------------------------------------------
-- Inserts 

-- Roles base
IF NOT EXISTS (SELECT 1 FROM dbo.Rol WHERE NombreRol = 'Administrador')
    INSERT INTO dbo.Rol (NombreRol, Descripcion) VALUES ('Administrador','Acceso completo al sistema');

IF NOT EXISTS (SELECT 1 FROM dbo.Rol WHERE NombreRol = 'Empleado')
    INSERT INTO dbo.Rol (NombreRol, Descripcion) VALUES ('Empleado','Acceso operativo limitado');

-- Índices 
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Usuario_Correo' AND object_id = OBJECT_ID('dbo.Usuario'))
    CREATE UNIQUE INDEX IX_Usuario_Correo ON dbo.Usuario(Correo);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Sesion_Token' AND object_id = OBJECT_ID('dbo.Sesion'))
    CREATE UNIQUE INDEX IX_Sesion_Token ON dbo.Sesion(Token);
GO



--crear usuario
CREATE OR ALTER PROCEDURE dbo.usp_Usuario_Create
  @Nombre        NVARCHAR(100),
  @Apellido      NVARCHAR(100) = NULL,
  @Correo        NVARCHAR(200),
  @PasswordHash  NVARCHAR(512),
  @Salt          NVARCHAR(100) = NULL,
  @Telefono      NVARCHAR(50) = NULL,
  @CreatedBy     INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  IF EXISTS (SELECT 1 FROM dbo.Usuario WHERE Correo = @Correo)
  BEGIN
    RAISERROR('EMAIL_DUPLICATE', 16, 1);
    RETURN;
  END

  BEGIN TRY
    INSERT INTO dbo.Usuario (Nombre, Apellido, Correo, PasswordHash, Salt, Telefono, CreatedBy)
    VALUES (@Nombre, @Apellido, @Correo, @PasswordHash, @Salt, @Telefono, @CreatedBy);

    SELECT SCOPE_IDENTITY() AS UsuarioID;
  END TRY
  BEGIN CATCH
    IF ERROR_NUMBER() IN (2601, 2627)
    BEGIN
      RAISERROR('EMAIL_DUPLICATE', 16, 1);
      RETURN;
    END

    DECLARE @ErrMsg NVARCHAR(2048) = ERROR_MESSAGE(),
            @ErrState INT = ERROR_STATE();
    RAISERROR(@ErrMsg, 16, @ErrState);
    RETURN;
  END CATCH
END
GO



--asignar actualizar rol

CREATE OR ALTER PROCEDURE dbo.usp_UsuarioRol_AssignOrUpdate
  @UsuarioID INT,
  @NombreRol NVARCHAR(50),
  @AssignedBy INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @RolID INT = (SELECT RolID FROM dbo.Rol WHERE NombreRol = @NombreRol AND IsActive = 1);
  IF @RolID IS NULL
  BEGIN
    ;THROW 51001, 'Rol no existe o inactivo.', 1;
  END

  IF EXISTS (SELECT 1 FROM dbo.UsuarioRol WHERE UsuarioID = @UsuarioID)
  BEGIN
    UPDATE ur
      SET RolID = @RolID, AssignedAt = SYSUTCDATETIME(), AssignedBy = @AssignedBy
    FROM dbo.UsuarioRol ur
    WHERE ur.UsuarioID = @UsuarioID;
  END
  ELSE
  BEGIN
    INSERT INTO dbo.UsuarioRol (UsuarioID, RolID, AssignedBy)
    VALUES (@UsuarioID, @RolID, @AssignedBy);
  END

  SELECT @UsuarioID AS UsuarioID, @RolID AS RolID;
END
GO


--obtener usuario

CREATE OR ALTER PROCEDURE dbo.usp_Usuario_GetByCorreo
  @Correo NVARCHAR(200)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP 1 u.*, r.NombreRol
  FROM dbo.Usuario u
  LEFT JOIN dbo.UsuarioRol ur ON ur.UsuarioID = u.UsuarioID
  LEFT JOIN dbo.Rol r ON r.RolID = ur.RolID
  WHERE u.Correo = @Correo AND u.IsActive = 1;
END
GO

--sesiones

CREATE OR ALTER PROCEDURE dbo.usp_Sesion_Create
  @UsuarioID INT,
  @Token NVARCHAR(512),
  @DeviceInfo NVARCHAR(500) = NULL,
  @IP NVARCHAR(50) = NULL,
  @ExpireAt DATETIME2
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.Sesion (UsuarioID, Token, DeviceInfo, IP, ExpireAt)
  VALUES (@UsuarioID, @Token, @DeviceInfo, @IP, @ExpireAt);

  SELECT SesionID, UsuarioID, Token, ExpireAt FROM dbo.Sesion WHERE Token = @Token;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Sesion_Invalidate
  @Token NVARCHAR(512)
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.Sesion SET IsActive = 0 WHERE Token = @Token;
  SELECT @@ROWCOUNT AS Affected;
END
GO

--listar usuarios
CREATE OR ALTER PROCEDURE dbo.usp_Usuario_List
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    u.UsuarioID,
    u.Nombre,
    u.Apellido,
    u.Correo,
    Rol = ISNULL((
      SELECT TOP (1) r.NombreRol
      FROM dbo.UsuarioRol ur
      JOIN dbo.Rol r ON r.RolID = ur.RolID
      WHERE ur.UsuarioID = u.UsuarioID
      ORDER BY ur.AssignedAt DESC
    ), 'Empleado'),
    u.IsActive
  FROM dbo.Usuario u
  WHERE u.IsActive = 1
  ORDER BY u.UsuarioID DESC;
END
GO

-------------------------------Usuario-------------------------------------------------------------

--Usuario  Test


-- Admin bootstrap contra Admin123!
DECLARE @Salt NVARCHAR(100) = 'iuBtI7mI/8NdxJvTIvpL+Q==';
DECLARE @Hash NVARCHAR(512) = 'iuBtI7mI/8NdxJvTIvpL+Q==:t+P/wEu2u9xYblIGzt7zjQu+RQXvA3SLz0o4qnKtmyo=';

INSERT INTO dbo.Usuario (Nombre, Apellido, Correo, PasswordHash, Salt, Telefono, IsActive)
VALUES ('Admin', 'Bootstrap', 'admin@profit.local', @Hash, @Salt, NULL, 1);

DECLARE @UsuarioID INT = SCOPE_IDENTITY();

-- Asigna rol Administrador
EXEC dbo.usp_UsuarioRol_AssignOrUpdate
  @UsuarioID = @UsuarioID,
  @NombreRol = 'Administrador',
  @AssignedBy = @UsuarioID; 
GO


-----------------------Productosss------------------------------
-- Módulos del sistema
IF OBJECT_ID('dbo.Modulo','U') IS NULL
CREATE TABLE dbo.Modulo (
  ModuloID INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(100) NOT NULL UNIQUE,
  IsActive BIT NOT NULL DEFAULT 1
);

-- Permisos por Rol y Módulo
IF OBJECT_ID('dbo.RolPermiso','U') IS NULL
CREATE TABLE dbo.RolPermiso (
  RolPermisoID INT IDENTITY(1,1) PRIMARY KEY,
  RolID INT NOT NULL,
  ModuloID INT NOT NULL,
  PuedeLeer BIT NOT NULL DEFAULT 0,
  PuedeEscribir BIT NOT NULL DEFAULT 0,
  CONSTRAINT UQ_RolModulo UNIQUE(RolID, ModuloID),
  CONSTRAINT FK_RolPermiso_Rol FOREIGN KEY (RolID) REFERENCES dbo.Rol(RolID),
  CONSTRAINT FK_RolPermiso_Mod FOREIGN KEY (ModuloID) REFERENCES dbo.Modulo(ModuloID)
);

-- Seed del módulo Inventario y permisos base
IF NOT EXISTS (SELECT 1 FROM dbo.Modulo WHERE Nombre='Inventario')
  INSERT INTO dbo.Modulo (Nombre) VALUES ('Inventario');

DECLARE @ModInv INT = (SELECT ModuloID FROM dbo.Modulo WHERE Nombre='Inventario');
DECLARE @RolAdmin INT = (SELECT RolID FROM dbo.Rol WHERE NombreRol='Administrador');
DECLARE @RolEmpleado INT = (SELECT RolID FROM dbo.Rol WHERE NombreRol='Empleado');

IF NOT EXISTS (SELECT 1 FROM dbo.RolPermiso WHERE RolID=@RolAdmin AND ModuloID=@ModInv)
  INSERT INTO dbo.RolPermiso(RolID, ModuloID, PuedeLeer, PuedeEscribir) VALUES (@RolAdmin, @ModInv, 1, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.RolPermiso WHERE RolID=@RolEmpleado AND ModuloID=@ModInv)
  INSERT INTO dbo.RolPermiso(RolID, ModuloID, PuedeLeer, PuedeEscribir) VALUES (@RolEmpleado, @ModInv, 1, 1);


CREATE OR ALTER PROCEDURE dbo.usp_Seguridad_PuedeAccederModulo
  @UsuarioID INT,
  @NombreModulo NVARCHAR(100),
  @Accion NVARCHAR(20) = 'Leer' 
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @ModuloID INT = (SELECT ModuloID FROM dbo.Modulo WHERE Nombre=@NombreModulo AND IsActive=1);
  IF @ModuloID IS NULL
  BEGIN
    RAISERROR('MODULO_INEXISTENTE',16,1);
    RETURN;
  END

  DECLARE @RolID INT = (
    SELECT TOP 1 ur.RolID
    FROM dbo.UsuarioRol ur
    JOIN dbo.Rol r ON r.RolID=ur.RolID AND r.IsActive=1
    WHERE ur.UsuarioID=@UsuarioID
    ORDER BY ur.AssignedAt DESC
  );

  IF @RolID IS NULL
  BEGIN
    SELECT CAST(0 AS BIT) AS HasAccess;
    RETURN;
  END

  IF @Accion='Leer'
    SELECT CAST(CASE WHEN rp.PuedeLeer=1 THEN 1 ELSE 0 END AS BIT) AS HasAccess
    FROM dbo.RolPermiso rp WHERE rp.RolID=@RolID AND rp.ModuloID=@ModuloID;
  ELSE
    SELECT CAST(CASE WHEN rp.PuedeEscribir=1 THEN 1 ELSE 0 END AS BIT) AS HasAccess
    FROM dbo.RolPermiso rp WHERE rp.RolID=@RolID AND rp.ModuloID=@ModuloID;
END
GO

------alta de productos ----------
CREATE OR ALTER PROCEDURE dbo.usp_Producto_Create
  @Nombre NVARCHAR(250),
  @PrecioVenta DECIMAL(18,2),
  @SKU NVARCHAR(100) = NULL,
  @Descripcion NVARCHAR(MAX) = NULL,
  @CodigoInterno NVARCHAR(100) = NULL,
  @UnidadAlmacenamientoID INT = NULL,
  @PrecioCosto DECIMAL(18,2) = NULL,
  @Peso DECIMAL(18,4) = NULL,
  @Largo DECIMAL(18,4) = NULL,
  @Alto DECIMAL(18,4) = NULL,
  @Ancho DECIMAL(18,4) = NULL,
  @CreatedBy INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  -- Validaciones 
  IF (@Nombre IS NULL OR LTRIM(RTRIM(@Nombre))='')
  BEGIN RAISERROR('FIELD_REQUIRED:Nombre',16,1); RETURN; END
  IF (@PrecioVenta IS NULL)
  BEGIN RAISERROR('FIELD_REQUIRED:PrecioVenta',16,1); RETURN; END

  IF @SKU IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Producto WHERE SKU=@SKU)
  BEGIN RAISERROR('SKU_DUPLICATE',16,1); RETURN; END

  BEGIN TRY
    INSERT INTO dbo.Producto
    (SKU,Nombre,Descripcion,CodigoInterno,Peso,Largo,Alto,Ancho,UnidadAlmacenamientoID,PrecioCosto,PrecioVenta,CreatedBy)
    VALUES (@SKU,@Nombre,@Descripcion,@CodigoInterno,@Peso,@Largo,@Alto,@Ancho,@UnidadAlmacenamientoID,@PrecioCosto,@PrecioVenta,@CreatedBy);

    SELECT SCOPE_IDENTITY() AS ProductoID;
  END TRY
  BEGIN CATCH
    DECLARE @Num INT = ERROR_NUMBER(), @Msg NVARCHAR(2048)=ERROR_MESSAGE();
    IF @Num IN (2601,2627) RAISERROR('SKU_DUPLICATE',16,1);
    ELSE RAISERROR(@Msg,16,1);
  END CATCH
END
GO

----consultas de existencias ---
CREATE OR ALTER PROCEDURE dbo.usp_Inventario_GetStock
  @ProductoID INT = NULL,
  @BodegaID INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    i.InventarioID,
    p.ProductoID, p.Nombre AS Producto, p.SKU,
    b.BodegaID, b.Nombre AS Bodega,
    i.Cantidad,
    i.CantidadReservada,
    (i.Cantidad - i.CantidadReservada) AS Disponible,
    i.FechaUltimaActualizacion
  FROM dbo.Inventario i
  JOIN dbo.Producto p ON p.ProductoID=i.ProductoID
  JOIN dbo.Bodega b ON b.BodegaID=i.BodegaID
  WHERE (@ProductoID IS NULL OR i.ProductoID=@ProductoID)
    AND (@BodegaID IS NULL OR i.BodegaID=@BodegaID)
  ORDER BY p.Nombre, b.Nombre;
END
GO

---mantener stock
CREATE OR ALTER PROCEDURE dbo.usp_Inventario_Ajuste
  @ProductoID INT,
  @BodegaID INT,
  @TipoMovimiento NVARCHAR(50), 
  @Cantidad DECIMAL(18,4),
  @Motivo NVARCHAR(250) = NULL,
  @UsuarioID INT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  IF @Cantidad <= 0 BEGIN RAISERROR('INVALID_QTY',16,1); RETURN; END

  BEGIN TRAN;

  DECLARE @Sign INT = CASE WHEN @TipoMovimiento IN ('Entrada','AjustePositivo') THEN +1 ELSE -1 END;

  IF NOT EXISTS (SELECT 1 FROM dbo.Inventario WHERE ProductoID=@ProductoID AND BodegaID=@BodegaID)
    INSERT INTO dbo.Inventario(ProductoID,BodegaID,Cantidad,CantidadReservada)
    VALUES(@ProductoID,@BodegaID,0,0);

  IF @Sign = -1
  BEGIN
    DECLARE @Disponible DECIMAL(18,4) =
      (SELECT (Cantidad - CantidadReservada) FROM dbo.Inventario WHERE ProductoID=@ProductoID AND BodegaID=@BodegaID);
    IF @Disponible < @Cantidad
    BEGIN ROLLBACK; RAISERROR('STOCK_INSUFICIENTE',16,1); RETURN; END
  END

  UPDATE dbo.Inventario
     SET Cantidad = Cantidad + (@Sign * @Cantidad),
         FechaUltimaActualizacion = SYSUTCDATETIME()
   WHERE ProductoID=@ProductoID AND BodegaID=@BodegaID;

  INSERT INTO dbo.MovimientoInventario(ProductoID,BodegaID,TipoMovimiento,Cantidad,ReferenciaTipo,Motivo,UsuarioID)
  VALUES(@ProductoID,@BodegaID,@TipoMovimiento,@Cantidad,NULL,@Motivo,@UsuarioID);

  COMMIT;
  SELECT 'OK' AS Result;
END
GO

---bodega create -----------
IF OBJECT_ID('dbo.Bodega') IS NULL
BEGIN
  CREATE TABLE dbo.Bodega(
    BodegaID   INT IDENTITY(1,1) PRIMARY KEY,
    Codigo     NVARCHAR(50)  NULL UNIQUE,
    Nombre     NVARCHAR(150) NOT NULL,
    Direccion  NVARCHAR(300) NULL,
    Contacto   NVARCHAR(150) NULL,
    IsActive   BIT NOT NULL DEFAULT(1)
  );
END
GO


--listar
CREATE OR ALTER PROCEDURE dbo.usp_Bodega_List
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    BodegaID,
    Codigo,
    Nombre,
    Direccion,
    Contacto,
    IsActive
  FROM dbo.Bodega
  WHERE IsActive = 1
  ORDER BY Nombre;
END
GO




---arreglo de eliminacion

IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[usp_Bodega_Create]') AND type = N'P')
    DROP PROCEDURE [dbo].[usp_Bodega_Create];
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[usp_Bodega_List]') AND type = N'P')
    DROP PROCEDURE [dbo].[usp_Bodega_List];
GO

---insertsss
IF NOT EXISTS (SELECT 1 FROM dbo.Bodega WHERE Codigo='CENTRAL')
INSERT dbo.Bodega (Codigo, Nombre, Direccion, Contacto, IsActive)
VALUES ('CENTRAL','Bodega Central','San José, CR','(506) 2222-0000',1);

IF NOT EXISTS (SELECT 1 FROM dbo.Bodega WHERE Codigo='OESTE')
INSERT dbo.Bodega (Codigo, Nombre, Direccion, Contacto, IsActive)
VALUES ('OESTE','Bodega Oeste','Escazú, CR',NULL,1);

IF NOT EXISTS (SELECT 1 FROM dbo.Bodega WHERE Codigo='ESTE')
INSERT dbo.Bodega (Codigo, Nombre, Direccion, Contacto, IsActive)
VALUES ('ESTE','Bodega Este','Curridabat, CR',NULL,1);
GO


IF OBJECT_ID('dbo.UnidadAlmacenamiento') IS NULL
BEGIN
  CREATE TABLE dbo.UnidadAlmacenamiento(
    UnidadID  INT IDENTITY(1,1) PRIMARY KEY,
    Codigo    NVARCHAR(10) NOT NULL UNIQUE,
    Nombre    NVARCHAR(100) NOT NULL,
    Activo    BIT NOT NULL DEFAULT(1)
  );
END
GO


-------productos unidad
USE [ProfitUpManagerBD];
GO

IF OBJECT_ID('dbo.UnidadAlmacenamiento') IS NULL
BEGIN
  CREATE TABLE dbo.UnidadAlmacenamiento(
    UnidadID  INT IDENTITY(1,1) PRIMARY KEY,
    Codigo    NVARCHAR(10) NOT NULL UNIQUE,
    Nombre    NVARCHAR(100) NOT NULL,
    Activo    BIT NOT NULL DEFAULT(1)
  );
END
GO


IF NOT EXISTS (SELECT 1 FROM dbo.UnidadAlmacenamiento WHERE Codigo='UN')
INSERT dbo.UnidadAlmacenamiento (Codigo, Nombre) VALUES ('UN', 'Unidad');

IF NOT EXISTS (SELECT 1 FROM dbo.UnidadAlmacenamiento WHERE Codigo='CJ')
INSERT dbo.UnidadAlmacenamiento (Codigo, Nombre) VALUES ('CJ', 'Caja');

IF NOT EXISTS (SELECT 1 FROM dbo.UnidadAlmacenamiento WHERE Codigo='KG')
INSERT dbo.UnidadAlmacenamiento (Codigo, Nombre) VALUES ('KG', 'Kilogramo');

IF NOT EXISTS (SELECT 1 FROM dbo.UnidadAlmacenamiento WHERE Codigo='LT')
INSERT dbo.UnidadAlmacenamiento (Codigo, Nombre) VALUES ('LT', 'Litro');
GO



IF COL_LENGTH('dbo.UnidadAlmacenamiento', 'Codigo') IS NULL
    ALTER TABLE dbo.UnidadAlmacenamiento ADD Codigo NVARCHAR(10) NULL;

IF COL_LENGTH('dbo.UnidadAlmacenamiento', 'Activo') IS NULL
BEGIN
    ALTER TABLE dbo.UnidadAlmacenamiento ADD Activo BIT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_UnidAlm_Activo')
        ALTER TABLE dbo.UnidadAlmacenamiento
        ADD CONSTRAINT DF_UnidAlm_Activo DEFAULT(1) FOR Activo;
END
GO


-- Backfill para filas existentes
UPDATE UA
SET
  Codigo = ISNULL(Codigo, CONCAT('U', UnidadID)),
  Activo = ISNULL(Activo, 1)
FROM dbo.UnidadAlmacenamiento UA;
GO


IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'UX_UnidadAlmacenamiento_Codigo' 
      AND object_id = OBJECT_ID('dbo.UnidadAlmacenamiento')
)
BEGIN
    CREATE UNIQUE INDEX UX_UnidadAlmacenamiento_Codigo 
    ON dbo.UnidadAlmacenamiento(Codigo)
    WHERE Codigo IS NOT NULL;
END
GO


MERGE dbo.UnidadAlmacenamiento AS tgt
USING (VALUES
('UN','Unidad',1),
('CJ','Caja',1),
('KG','Kilogramo',1),
('LT','Litro',1)
) AS src(Codigo, Nombre, Activo)
ON tgt.Codigo = src.Codigo
WHEN NOT MATCHED BY TARGET THEN
  INSERT (Codigo, Nombre, Activo) VALUES (src.Codigo, src.Nombre, src.Activo);
GO



SELECT UnidadID, Codigo, Nombre FROM dbo.UnidadAlmacenamiento ORDER BY UnidadID;

-- SP para listar unidades activas
CREATE OR ALTER PROCEDURE dbo.usp_Unidad_List
AS
BEGIN
  SET NOCOUNT ON;
  SELECT UnidadID, Codigo, Nombre, Activo
  FROM dbo.UnidadAlmacenamiento
  WHERE Activo = 1
  ORDER BY Nombre;
END
GO



