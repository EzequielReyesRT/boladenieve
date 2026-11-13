-- ==============================================================================
-- ESQUEMA DE BASE DE DATOS: MÉTODO BOLA DE NIEVE (SUPABASE / POSTGRESQL)
-- ==============================================================================

-- Habilitar extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABLA: CONFIGURACIÓN DEL USUARIO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.configuracion_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    pago_extra_mensual NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (pago_extra_mensual >= 0),
    mes_calendario_inicio SMALLINT NOT NULL DEFAULT 1 CHECK (mes_calendario_inicio BETWEEN 1 AND 12),
    anio_inicio SMALLINT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT,
    aportacion_unica_anual NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (aportacion_unica_anual >= 0),
    mes_aportacion_unica SMALLINT NOT NULL DEFAULT 12 CHECK (mes_aportacion_unica BETWEEN 1 AND 12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. TABLA: DEUDAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deudas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_tarjeta VARCHAR(120) NOT NULL,
    saldo_inicial NUMERIC(12, 2) NOT NULL CHECK (saldo_inicial >= 0),
    tasa_anual_porcentaje NUMERIC(5, 2) NOT NULL CHECK (tasa_anual_porcentaje >= 0),
    pago_minimo NUMERIC(12, 2) NOT NULL CHECK (pago_minimo >= 0),
    costo_anualidad NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (costo_anualidad >= 0),
    mes_cobro_anualidad SMALLINT NOT NULL DEFAULT 1 CHECK (mes_cobro_anualidad BETWEEN 1 AND 12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de consulta frecuente para deudas
CREATE INDEX IF NOT EXISTS idx_deudas_user_id ON public.deudas(user_id);

-- ------------------------------------------------------------------------------
-- 3. TABLA: BITÁCORA DE PAGOS
-- ------------------------------------------------------------------------------
CREATE TYPE tipo_pago_enum AS ENUM ('Minimo', 'Extra', 'Anualidad', 'Liquidacion');

CREATE TABLE IF NOT EXISTS public.bitacora_pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deuda_id UUID NOT NULL REFERENCES public.deudas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_pago VARCHAR(20) NOT NULL CHECK (tipo_pago IN ('Minimo', 'Extra', 'Anualidad', 'Liquidacion')),
    monto_total NUMERIC(12, 2) NOT NULL CHECK (monto_total > 0),
    intereses_cobrados NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (intereses_cobrados >= 0),
    folio_comprobante VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para optimizar reportes y cálculo de saldos
CREATE INDEX IF NOT EXISTS idx_bitacora_deuda_id ON public.bitacora_pagos(deuda_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_user_id ON public.bitacora_pagos(user_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha_pago ON public.bitacora_pagos(fecha_pago DESC);

-- ------------------------------------------------------------------------------
-- 4. VISTA: VISTA_RESUMEN_DEUDAS (Saldos Calculados en Tiempo Real)
-- ------------------------------------------------------------------------------
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
            LEAST(100.0, ROUND((GREATEST(0, COALESCE(SUM(b.monto_total - b.intereses_cobrados), 0)) / d.saldo_inicial) * 100.0, 2))
        ELSE 100.0 
    END AS porcentaje_avance,
    CASE 
        WHEN (d.saldo_inicial - GREATEST(0, COALESCE(SUM(b.monto_total - b.intereses_cobrados), 0))) <= 0.01 THEN TRUE 
        ELSE FALSE 
    END AS esta_liquidada
FROM public.deudas d
LEFT JOIN public.bitacora_pagos b ON d.id = b.deuda_id
GROUP BY d.id;

-- ------------------------------------------------------------------------------
-- 5. TRIGGER: ACTUALIZACIÓN AUTOMÁTICA DE updated_at
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_config_updated_at ON public.configuracion_usuario;
CREATE TRIGGER trigger_config_updated_at
    BEFORE UPDATE ON public.configuracion_usuario
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_deudas_updated_at ON public.deudas;
CREATE TRIGGER trigger_deudas_updated_at
    BEFORE UPDATE ON public.deudas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.configuracion_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deudas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_pagos ENABLE ROW LEVEL SECURITY;

-- Políticas para configuracion_usuario
CREATE POLICY "Usuarios pueden consultar su propia configuracion"
    ON public.configuracion_usuario FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'anon');

CREATE POLICY "Usuarios pueden insertar o modificar su propia configuracion"
    ON public.configuracion_usuario FOR ALL
    USING (auth.uid() = user_id OR auth.role() = 'anon');

-- Políticas para deudas
CREATE POLICY "Usuarios pueden consultar sus propias deudas"
    ON public.deudas FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'anon');

CREATE POLICY "Usuarios pueden administrar sus propias deudas"
    ON public.deudas FOR ALL
    USING (auth.uid() = user_id OR auth.role() = 'anon');

-- Políticas para bitacora_pagos
CREATE POLICY "Usuarios pueden consultar su historial de pagos"
    ON public.bitacora_pagos FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'anon');

CREATE POLICY "Usuarios pueden registrar y gestionar sus pagos"
    ON public.bitacora_pagos FOR ALL
    USING (auth.uid() = user_id OR auth.role() = 'anon');
