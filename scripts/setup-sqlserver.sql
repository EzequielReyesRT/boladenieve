-- ==============================================================================
-- BASE DE DATOS: BOLA DE NIEVE (SQL SERVER 2022 / SQLEXPRESS)
-- ==============================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'BolaDeNieve')
BEGIN
    CREATE DATABASE [BolaDeNieve];
    PRINT 'Base de datos [BolaDeNieve] creada con éxito.';
END
ELSE
BEGIN
    PRINT 'Base de datos [BolaDeNieve] ya existe.';
END
GO

USE [BolaDeNieve];
GO

-- 0. Tabla Usuarios
IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        Nombre NVARCHAR(120) NOT NULL,
        Email NVARCHAR(120) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        Rol NVARCHAR(50) NOT NULL DEFAULT 'admin',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    INSERT INTO dbo.Usuarios (Id, Nombre, Email, PasswordHash, Rol)
    VALUES (N'u-admin', N'Ezequiel Reyes', N'admin', N'$2b$10$5c1HIHHnZXcePOKEQuob4uQriiHQyqa6DfrgTJMbwDxTiDBGyUPem', N'admin');
    PRINT 'Tabla [Usuarios] creada.';
END
GO

-- 1. Tabla ConfiguracionUsuario
IF OBJECT_ID(N'dbo.ConfiguracionUsuario', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConfiguracionUsuario (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        PagoExtraMensual DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        MesCalendarioInicio SMALLINT NOT NULL DEFAULT 1,
        AnioInicio SMALLINT NOT NULL DEFAULT 2026,
        AportacionUnicaAnual DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        MesAportacionUnica SMALLINT NOT NULL DEFAULT 12,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    PRINT 'Tabla [ConfiguracionUsuario] creada.';
END
GO

-- 2. Tabla Deudas
IF OBJECT_ID(N'dbo.Deudas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Deudas (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        NombreTarjeta NVARCHAR(120) NOT NULL,
        SaldoInicial DECIMAL(12, 2) NOT NULL,
        TasaAnualPorcentaje DECIMAL(5, 2) NOT NULL,
        PagoMinimo DECIMAL(12, 2) NOT NULL,
        CostoAnualidad DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        MesCobroAnualidad SMALLINT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    PRINT 'Tabla [Deudas] creada.';
END
GO

-- 3. Tabla BitacoraPagos
IF OBJECT_ID(N'dbo.BitacoraPagos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BitacoraPagos (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        DeudaId NVARCHAR(50) NOT NULL CONSTRAINT FK_Bitacora_Deudas FOREIGN KEY REFERENCES dbo.Deudas(Id) ON DELETE CASCADE,
        FechaPago DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        TipoPago NVARCHAR(20) NOT NULL,
        MontoTotal DECIMAL(12, 2) NOT NULL,
        InteresesCobrados DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        FolioComprobante NVARCHAR(255) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    PRINT 'Tabla [BitacoraPagos] creada.';
END
GO

-- 4. Vista de Resumen y Saldos
IF OBJECT_ID(N'dbo.VistaResumenDeudas', N'V') IS NOT NULL
    DROP VIEW dbo.VistaResumenDeudas;
GO

CREATE VIEW dbo.VistaResumenDeudas AS
SELECT 
    d.Id,
    d.NombreTarjeta,
    d.SaldoInicial,
    d.TasaAnualPorcentaje,
    d.PagoMinimo,
    d.CostoAnualidad,
    d.MesCobroAnualidad,
    d.CreatedAt,
    ISNULL(SUM(b.MontoTotal), 0) AS TotalPagado,
    ISNULL(SUM(b.InteresesCobrados), 0) AS TotalInteresesPagados,
    CASE 
        WHEN ISNULL(SUM(b.MontoTotal - b.InteresesCobrados), 0) < 0 THEN 0
        ELSE ISNULL(SUM(b.MontoTotal - b.InteresesCobrados), 0)
    END AS AmortizacionCapital,
    CASE 
        WHEN (d.SaldoInicial - CASE WHEN ISNULL(SUM(b.MontoTotal - b.InteresesCobrados), 0) < 0 THEN 0 ELSE ISNULL(SUM(b.MontoTotal - b.InteresesCobrados), 0) END) < 0 THEN 0
        ELSE (d.SaldoInicial - CASE WHEN ISNULL(SUM(b.MontoTotal - b.InteresesCobrados), 0) < 0 THEN 0 ELSE ISNULL(SUM(b.MontoTotal - b.InteresesCobrados), 0) END)
    END AS SaldoActual,
    CASE 
        WHEN d.SaldoInicial > 0 THEN 
            ROUND((CASE WHEN ISNULL(SUM(b.MontoTotal - b.InteresesCobrados), 0) < 0 THEN 0 ELSE ISNULL(SUM(b.MontoTotal - b.InteresesCobrados), 0) END / d.SaldoInicial) * 100.0, 2)
        ELSE 100.0 
    END AS PorcentajeAvance,
    CASE 
        WHEN (d.SaldoInicial - CASE WHEN ISNULL(SUM(b.MontoTotal - b.InteresesCobrados), 0) < 0 THEN 0 ELSE ISNULL(SUM(b.MontoTotal - b.InteresesCobrados), 0) END) <= 0.01 THEN 1
        ELSE 0
    END AS EstaLiquidada
FROM dbo.Deudas d
LEFT JOIN dbo.BitacoraPagos b ON d.Id = b.DeudaId
GROUP BY d.Id, d.NombreTarjeta, d.SaldoInicial, d.TasaAnualPorcentaje, d.PagoMinimo, d.CostoAnualidad, d.MesCobroAnualidad, d.CreatedAt;
GO

-- ------------------------------------------------------------------------------
-- 5. SEMBRAR LA COPIA EXACTA DE TUS 12 DEUDAS Y CONFIGURACIÓN
-- ------------------------------------------------------------------------------

-- Configuración
IF NOT EXISTS (SELECT 1 FROM dbo.ConfiguracionUsuario WHERE Id = N'config-default')
BEGIN
    INSERT INTO dbo.ConfiguracionUsuario (
        Id, PagoExtraMensual, MesCalendarioInicio, AnioInicio, AportacionUnicaAnual, MesAportacionUnica
    ) VALUES (
        N'config-default', 500.00, 11, 2026, 2000.00, 12
    );
    PRINT 'Configuración predeterminada insertada.';
END
GO

-- Deudas
IF NOT EXISTS (SELECT 1 FROM dbo.Deudas WHERE Id = N'd-1794446685899')
BEGIN
    INSERT INTO dbo.Deudas (Id, NombreTarjeta, SaldoInicial, TasaAnualPorcentaje, PagoMinimo, CostoAnualidad, MesCobroAnualidad)
    VALUES
        (N'd-1794446685899', N'Stori', 1263.38, 69.90, 300.00, 0.00, 1),
        (N'd-1794446734206', N'Klar', 1443.80, 123.10, 300.00, 0.00, 1),
        (N'd-1794446789602', N'Banorte', 7004.48, 62.10, 1000.00, 675.00, 1),
        (N'd-1794446816052', N'Santander Gold', 7548.86, 52.10, 700.00, 950.00, 1),
        (N'd-1794446838582', N'Nu', 10532.63, 0.00, 700.00, 0.00, 1),
        (N'd-1794446886274', N'Santander Like U', 11004.43, 66.40, 650.00, 0.00, 1),
        (N'd-1794447694486', N'Credito BBVA 3', 13960.16, 0.00, 370.00, 0.00, 1),
        (N'd-1794447650345', N'Credito BBVA 2', 15744.15, 0.00, 364.81, 0.00, 1),
        (N'd-1794447796904', N'Caja Real', 15854.88, 0.00, 2300.00, 0.00, 1),
        (N'd-1794446927773', N'BBVA', 41690.20, 59.50, 2000.00, 0.00, 1),
        (N'd-1794447757753', N'Nu Credito', 54032.04, 0.00, 3001.78, 0.00, 1),
        (N'd-1794447612056', N'Credito BBVA 1', 62737.25, 0.00, 1462.00, 0.00, 1);
    PRINT '12 deudas insertadas en SQL Server.';
END
GO
