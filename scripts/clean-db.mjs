import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../dev-db');

console.log(`🔌 Conectando a la base de datos PostgreSQL local en: ${dbPath}`);

const db = new PGlite(dbPath);

async function clean() {
  try {
    console.log('🧹 Limpiando registros de deudas y bitácora de pagos...');

    // Eliminar pagos y deudas
    await db.exec('DELETE FROM bitacora_pagos;');
    await db.exec('DELETE FROM deudas;');

    // Restablecer configuración a valores limpios iniciales
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    await db.query(`
      INSERT INTO configuracion_usuario (
        id, pago_extra_mensual, mes_calendario_inicio, anio_inicio, aportacion_unica_anual, mes_aportacion_unica, updated_at
      ) VALUES (
        'config-default', 0.00, $1, $2, 0.00, 12, CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        pago_extra_mensual = 0.00,
        mes_calendario_inicio = $1,
        anio_inicio = $2,
        aportacion_unica_anual = 0.00,
        mes_aportacion_unica = 12,
        updated_at = CURRENT_TIMESTAMP;
    `, [mesActual, anioActual]);

    // Verificar conteos
    const deudasCount = await db.query('SELECT COUNT(*) as count FROM deudas');
    const pagosCount = await db.query('SELECT COUNT(*) as count FROM bitacora_pagos');
    const configRes = await db.query('SELECT * FROM configuracion_usuario LIMIT 1');

    console.log('\n✅ Base de datos completamente limpia y lista para captura:');
    console.log(`- Deudas registradas: ${deudasCount.rows[0].count}`);
    console.log(`- Pagos registrados: ${pagosCount.rows[0].count}`);
    console.log('- Configuración inicial:', configRes.rows[0]);

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    process.exit(1);
  }
}

clean();
