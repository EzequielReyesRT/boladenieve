-- ==============================================================================
-- BASE DE DATOS DE PRODUCCIÓN: BOLA DE NIEVE
-- Copia de seguridad exacta exportada desde el entorno local
-- Generado: 2026-11-13T00:42:56.639Z
-- Total deudas capturadas: 12
-- ==============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Eliminar tablas previas si existen (opcional, para recrear limpiamente)
DROP VIEW IF EXISTS public.vista_resumen_deudas CASCADE;
DROP TABLE IF EXISTS public.bitacora_pagos CASCADE;
DROP TABLE IF EXISTS public.deudas CASCADE;
DROP TABLE IF EXISTS public.configuracion_usuario CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;

-- 3. Crear Tablas de Producción
CREATE TABLE public.usuarios (
    id TEXT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.configuracion_usuario (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    pago_extra_mensual NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (pago_extra_mensual >= 0),
    mes_calendario_inicio SMALLINT NOT NULL DEFAULT 1 CHECK (mes_calendario_inicio BETWEEN 1 AND 12),
    anio_inicio SMALLINT NOT NULL DEFAULT 2026,
    aportacion_unica_anual NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (aportacion_unica_anual >= 0),
    mes_aportacion_unica SMALLINT NOT NULL DEFAULT 12 CHECK (mes_aportacion_unica BETWEEN 1 AND 12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.deudas (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    nombre_tarjeta VARCHAR(120) NOT NULL,
    saldo_inicial NUMERIC(12, 2) NOT NULL CHECK (saldo_inicial >= 0),
    tasa_anual_porcentaje NUMERIC(5, 2) NOT NULL CHECK (tasa_anual_porcentaje >= 0),
    pago_minimo NUMERIC(12, 2) NOT NULL CHECK (pago_minimo >= 0),
    costo_anualidad NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (costo_anualidad >= 0),
    mes_cobro_anualidad SMALLINT NOT NULL DEFAULT 1 CHECK (mes_cobro_anualidad BETWEEN 1 AND 12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.bitacora_pagos (
    id TEXT PRIMARY KEY,
    deuda_id TEXT NOT NULL REFERENCES public.deudas(id) ON DELETE CASCADE,
    user_id TEXT,
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_pago VARCHAR(20) NOT NULL CHECK (tipo_pago IN ('Minimo', 'Extra', 'Anualidad', 'Liquidacion')),
    monto_total NUMERIC(12, 2) NOT NULL CHECK (monto_total > 0),
    intereses_cobrados NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (intereses_cobrados >= 0),
    folio_comprobante VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Crear Vista Calculada en Tiempo Real
CREATE OR REPLACE VIEW public.vista_resumen_deudas AS
SELECT 
    d.id,
    d.user_id,
    d.nombre_tarjeta,
    d.saldo_inicial,
    d.tasa_anual_porcentaje,
    d.pago_minimo,
    d.costo_anualidad,
    d.mes_cobro_anualidad,
    d.created_at,
    COALESCE(SUM(b.monto_total), 0) AS total_pagado,
    COALESCE(SUM(b.intereses_cobrados), 0) AS total_intereses_pagados,
    GREATEST(0, COALESCE(SUM(b.monto_total - b.intereses_cobrados), 0)) AS amortizacion_capital,
    GREATEST(0, d.saldo_inicial - GREATEST(0, COALESCE(SUM(b.monto_total - b.intereses_cobrados), 0))) AS saldo_actual,
    CASE 
        WHEN d.saldo_inicial > 0 THEN 
            ROUND((GREATEST(0, COALESCE(SUM(b.monto_total - b.intereses_cobrados), 0)) / d.saldo_inicial) * 100.0, 2)
        ELSE 100.0 
    END AS porcentaje_avance,
    CASE 
        WHEN (d.saldo_inicial - GREATEST(0, COALESCE(SUM(b.monto_total - b.intereses_cobrados), 0))) <= 0.01 THEN TRUE 
        ELSE FALSE 
    END AS esta_liquidada
FROM public.deudas d
LEFT JOIN public.bitacora_pagos b ON d.id = b.deuda_id
GROUP BY d.id;

-- 5. Habilitar Seguridad RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deudas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura usuarios" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Escritura usuarios" ON public.usuarios FOR ALL USING (true);

CREATE POLICY "Lectura configuracion" ON public.configuracion_usuario FOR SELECT USING (true);
CREATE POLICY "Escritura configuracion" ON public.configuracion_usuario FOR ALL USING (true);

CREATE POLICY "Lectura deudas" ON public.deudas FOR SELECT USING (true);
CREATE POLICY "Escritura deudas" ON public.deudas FOR ALL USING (true);

CREATE POLICY "Lectura bitacora" ON public.bitacora_pagos FOR SELECT USING (true);
CREATE POLICY "Escritura bitacora" ON public.bitacora_pagos FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 6. COPIA EXACTA DE TUS DATOS (USUARIOS, CONFIGURACIÓN, DEUDAS Y BITÁCORA)
-- ------------------------------------------------------------------------------

-- 1 Usuario(s) Registrado(s):
INSERT INTO public.usuarios (id, nombre, email, password_hash, rol)
VALUES
    ('u-admin', 'Ezequiel Reyes', 'admin', '$2b$10$5c1HIHHnZXcePOKEQuob4uQriiHQyqa6DfrgTJMbwDxTiDBGyUPem', 'admin');

-- Configuración Actual:
INSERT INTO public.configuracion_usuario (
    id, pago_extra_mensual, mes_calendario_inicio, anio_inicio, aportacion_unica_anual, mes_aportacion_unica
) VALUES (
    'config-default', 500.00, 11, 2026, 2000.00, 12
);

-- 12 Deudas Registradas:
INSERT INTO public.deudas (
    id, nombre_tarjeta, saldo_inicial, tasa_anual_porcentaje, pago_minimo, costo_anualidad, mes_cobro_anualidad, created_at
) VALUES
    ('d-1794446685899', 'Stori', 1263.38, 69.90, 300.00, 0.00, 1, '2026-11-12T01:24:46.220Z'),
    ('d-1794446734206', 'Klar', 1443.80, 123.10, 300.00, 0.00, 1, '2026-11-12T01:25:34.217Z'),
    ('d-1794446789602', 'Banorte', 7004.48, 62.10, 1000.00, 675.00, 1, '2026-11-12T01:26:29.613Z'),
    ('d-1794446816052', 'Santander Gold', 7548.86, 52.10, 700.00, 950.00, 1, '2026-11-12T01:26:56.062Z'),
    ('d-1794446838582', 'Nu', 10532.63, 0.00, 700.00, 0.00, 1, '2026-11-12T01:27:18.592Z'),
    ('d-1794446886274', 'Santander Like U', 11004.43, 66.40, 650.00, 0.00, 1, '2026-11-12T01:28:06.293Z'),
    ('d-1794447694486', 'Credito BBVA 3', 13960.16, 0.00, 370.00, 0.00, 1, '2026-11-12T01:41:34.500Z'),
    ('d-1794447650345', 'Credito BBVA 2', 15744.15, 0.00, 364.81, 0.00, 1, '2026-11-12T01:40:50.357Z'),
    ('d-1794447796904', 'Caja Real', 15854.88, 0.00, 2300.00, 0.00, 1, '2026-11-12T01:43:16.917Z'),
    ('d-1794446927773', 'BBVA', 41690.20, 59.50, 2000.00, 0.00, 1, '2026-11-12T01:28:47.782Z'),
    ('d-1794447757753', 'Nu Credito', 54032.04, 0.00, 3001.78, 0.00, 1, '2026-11-12T01:42:37.765Z'),
    ('d-1794447612056', 'Credito BBVA 1', 62737.25, 0.00, 1462.00, 0.00, 1, '2026-11-12T01:40:12.103Z');

