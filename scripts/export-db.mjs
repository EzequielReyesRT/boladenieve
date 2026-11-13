import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../dev-db');
const outputPath = path.resolve(__dirname, '../supabase/production-seed.sql');

console.log(`🔌 Extrayendo copia exacta de la base de datos desde: ${dbPath}`);

const db = new PGlite(dbPath);

async function exportDb() {
  try {
    const [usuariosRes, configRes, deudasRes, pagosRes] = await Promise.all([
      db.query('SELECT * FROM usuarios'),
      db.query('SELECT * FROM configuracion_usuario'),
      db.query('SELECT * FROM deudas ORDER BY saldo_inicial ASC'),
      db.query('SELECT * FROM bitacora_pagos ORDER BY fecha_pago ASC'),
    ]);

    let sql = `-- ==============================================================================
-- BASE DE DATOS DE PRODUCCIÓN: BOLA DE NIEVE
-- Copia de seguridad exacta exportada desde el entorno local
-- Generado: ${new Date().toISOString()}
-- Total deudas capturadas: ${deudasRes.rows.length}
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

`;

    // Exportar usuarios
    if (usuariosRes.rows.length > 0) {
      sql += `-- ${usuariosRes.rows.length} Usuario(s) Registrado(s):\n`;
      sql += `INSERT INTO public.usuarios (id, nombre, email, password_hash, rol)\nVALUES\n`;
      const userValues = usuariosRes.rows.map((u) => {
        const nombre = u.nombre.replace(/'/g, "''");
        const email = u.email.replace(/'/g, "''");
        return `    ('${u.id}', '${nombre}', '${email}', '${u.password_hash}', '${u.rol}')`;
      });
      sql += userValues.join(',\n') + ';\n\n';
    }

    // Exportar configuración
    if (configRes.rows.length > 0) {
      const c = configRes.rows[0];
      sql += `-- Configuración Actual:\n`;
      sql += `INSERT INTO public.configuracion_usuario (
    id, pago_extra_mensual, mes_calendario_inicio, anio_inicio, aportacion_unica_anual, mes_aportacion_unica
) VALUES (
    '${c.id}', ${c.pago_extra_mensual}, ${c.mes_calendario_inicio}, ${c.anio_inicio || 2026}, ${c.aportacion_unica_anual}, ${c.mes_aportacion_unica}
);\n\n`;
    }

    // Exportar deudas
    if (deudasRes.rows.length > 0) {
      sql += `-- ${deudasRes.rows.length} Deudas Registradas:\n`;
      sql += `INSERT INTO public.deudas (
    id, nombre_tarjeta, saldo_inicial, tasa_anual_porcentaje, pago_minimo, costo_anualidad, mes_cobro_anualidad, created_at
) VALUES\n`;

      const debtValues = deudasRes.rows.map((d) => {
        const nombre = d.nombre_tarjeta.replace(/'/g, "''");
        const createdAt = d.created_at ? `'${new Date(d.created_at).toISOString()}'` : `now()`;
        return `    ('${d.id}', '${nombre}', ${d.saldo_inicial}, ${d.tasa_anual_porcentaje}, ${d.pago_minimo}, ${d.costo_anualidad || 0}, ${d.mes_cobro_anualidad || 1}, ${createdAt})`;
      });

      sql += debtValues.join(',\n') + ';\n\n';
    }

    // Exportar pagos
    if (pagosRes.rows.length > 0) {
      sql += `-- ${pagosRes.rows.length} Pagos Registrados:\n`;
      sql += `INSERT INTO public.bitacora_pagos (
    id, deuda_id, fecha_pago, tipo_pago, monto_total, intereses_cobrados, folio_comprobante, created_at
) VALUES\n`;

      const paymentValues = pagosRes.rows.map((p) => {
        const folio = p.folio_comprobante ? `'${p.folio_comprobante.replace(/'/g, "''")}'` : 'NULL';
        const createdAt = p.created_at ? `'${new Date(p.created_at).toISOString()}'` : `now()`;
        return `    ('${p.id}', '${p.deuda_id}', '${p.fecha_pago}', '${p.tipo_pago}', ${p.monto_total}, ${p.intereses_cobrados || 0}, ${folio}, ${createdAt})`;
      });

      sql += paymentValues.join(',\n') + ';\n\n';
    }

    fs.writeFileSync(outputPath, sql, 'utf-8');
    console.log(`✅ Archivo exportado exitosamente en: ${outputPath}`);
    console.log(`📊 Resumen exportado:`);
    console.log(`- ${deudasRes.rows.length} deudas`);
    console.log(`- ${pagosRes.rows.length} pagos`);

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al exportar la base de datos:', error);
    process.exit(1);
  }
}

exportDb();
