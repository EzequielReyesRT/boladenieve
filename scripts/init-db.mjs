import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../dev-db');

console.log(`🔌 Conectando a la base de datos PostgreSQL local en: ${dbPath}`);

const db = new PGlite(dbPath);

async function init() {
  try {
    console.log('🚀 Creando tablas y esquemas de base de datos...');

    // 0. Usuarios
    await db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 1. Configuracion Usuario
    await db.exec(`
      CREATE TABLE IF NOT EXISTS configuracion_usuario (
        id TEXT PRIMARY KEY,
        pago_extra_mensual NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        mes_calendario_inicio SMALLINT NOT NULL DEFAULT 1,
        anio_inicio SMALLINT NOT NULL DEFAULT 2026,
        aportacion_unica_anual NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        mes_aportacion_unica SMALLINT NOT NULL DEFAULT 12,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Deudas
    await db.exec(`
      CREATE TABLE IF NOT EXISTS deudas (
        id TEXT PRIMARY KEY,
        nombre_tarjeta VARCHAR(120) NOT NULL,
        saldo_inicial NUMERIC(12, 2) NOT NULL,
        tasa_anual_porcentaje NUMERIC(5, 2) NOT NULL,
        pago_minimo NUMERIC(12, 2) NOT NULL,
        costo_anualidad NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        mes_cobro_anualidad SMALLINT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Bitacora de Pagos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS bitacora_pagos (
        id TEXT PRIMARY KEY,
        deuda_id TEXT NOT NULL REFERENCES deudas(id) ON DELETE CASCADE,
        fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
        tipo_pago VARCHAR(20) NOT NULL,
        monto_total NUMERIC(12, 2) NOT NULL,
        intereses_cobrados NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        folio_comprobante VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Vista de saldos calculados
    await db.exec(`
      CREATE OR REPLACE VIEW vista_resumen_deudas AS
      SELECT 
        d.id,
        d.nombre_tarjeta,
        d.saldo_inicial,
        d.tasa_anual_porcentaje,
        d.pago_minimo,
        d.costo_anualidad,
        d.mes_cobro_anualidad,
        COALESCE(SUM(b.monto_total), 0) AS total_pagado,
        COALESCE(SUM(b.intereses_cobrados), 0) AS total_intereses_pagados,
        GREATEST(0, COALESCE(SUM(b.monto_total - b.intereses_cobrados), 0)) AS amortizacion_capital,
        GREATEST(0, d.saldo_inicial - GREATEST(0, COALESCE(SUM(b.monto_total - b.intereses_cobrados), 0))) AS saldo_actual,
        CASE 
          WHEN d.saldo_inicial > 0 THEN 
            ROUND((GREATEST(0, COALESCE(SUM(b.monto_total - b.intereses_cobrados), 0)) / d.saldo_inicial) * 100.0, 2)
          ELSE 100.0 
        END AS porcentaje_avance
      FROM deudas d
      LEFT JOIN bitacora_pagos b ON d.id = b.deuda_id
      GROUP BY d.id;
    `);

    console.log('✅ Tablas y vistas creadas correctamente.');

    // Verificar si ya hay usuario admin
    const userCheck = await db.query('SELECT COUNT(*) as count FROM usuarios');
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      console.log('👤 Creando usuario administrador inicial (admin / Admin123*)...');
      await db.query(`
        INSERT INTO usuarios (id, nombre, email, password_hash, rol)
        VALUES ('u-admin', 'Ezequiel Reyes', 'admin', '$2b$10$5c1HIHHnZXcePOKEQuob4uQriiHQyqa6DfrgTJMbwDxTiDBGyUPem', 'admin')
      `);
    }

    // Verificar si ya hay datos de configuración
    const configCheck = await db.query('SELECT COUNT(*) as count FROM configuracion_usuario');
    if (parseInt(configCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Insertando configuración inicial...');
      await db.query(`
        INSERT INTO configuracion_usuario (
          id, pago_extra_mensual, mes_calendario_inicio, anio_inicio, aportacion_unica_anual, mes_aportacion_unica
        ) VALUES (
          'config-default', 2000.00, 11, 2026, 12000.00, 12
        );
      `);
    }

    // Verificar si ya hay deudas
    const deudasCheck = await db.query('SELECT COUNT(*) as count FROM deudas');
    if (parseInt(deudasCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Insertando deudas iniciales para desarrollo...');
      await db.query(`
        INSERT INTO deudas (id, nombre_tarjeta, saldo_inicial, tasa_anual_porcentaje, pago_minimo, costo_anualidad, mes_cobro_anualidad)
        VALUES 
          ('d-1', 'Liverpool Departamental', 7800.00, 58.00, 650.00, 0.00, 1),
          ('d-2', 'BBVA Azul Crédito', 16500.00, 49.50, 1100.00, 780.00, 6),
          ('d-3', 'Banorte Oro Clásica', 32000.00, 42.00, 1950.00, 1150.00, 11),
          ('d-4', 'Préstamo Nómina Santander', 55000.00, 29.90, 3200.00, 0.00, 1);
      `);

      console.log('🌱 Insertando historial inicial de pagos...');
      await db.query(`
        INSERT INTO bitacora_pagos (id, deuda_id, fecha_pago, tipo_pago, monto_total, intereses_cobrados, folio_comprobante)
        VALUES
          ('p-1', 'd-1', '2026-10-05', 'Extra', 2500.00, 320.00, 'SPEI-8849102-LIV'),
          ('p-2', 'd-2', '2026-10-10', 'Minimo', 1100.00, 580.00, 'APP-BBVA-9921'),
          ('p-3', 'd-3', '2026-10-15', 'Minimo', 1950.00, 980.00, 'BNT-0044812');
      `);
    }

    const testSummary = await db.query('SELECT * FROM vista_resumen_deudas ORDER BY saldo_actual ASC');
    console.log('\n📊 Estado actual de la base de datos de desarrollo:');
    console.table(testSummary.rows);

    console.log('\n✨ Base de datos local inicializada con éxito.');
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

init();
