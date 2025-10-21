USE [ProfitUpManagerBD]
GO
/****** Object:  StoredProcedure [dbo].[usp_Producto_MiniList]    Script Date: 10/20/2025 5:49:31 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER   PROCEDURE [dbo].[usp_Producto_MiniList]
AS
BEGIN
  SET NOCOUNT ON;
  SELECT ProductoID, SKU, Nombre, Descripcion, PrecioVenta
  FROM dbo.Producto
  WHERE IsActive = 1
  ORDER BY Nombre;
END
