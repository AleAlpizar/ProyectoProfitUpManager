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
