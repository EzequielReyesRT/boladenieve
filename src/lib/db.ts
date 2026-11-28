import { PGlite } from '@electric-sql/pglite';
import path from 'path';

declare global {
  var __pglite_db__: PGlite | undefined;
  var __pglite_migrated__: boolean | undefined;
}

export function getDb(): PGlite {
  if (!globalThis.__pglite_db__) {
    const dbPath = path.resolve(process.cwd(), 'dev-db');
    globalThis.__pglite_db__ = new PGlite(dbPath);
  }

  if (!globalThis.__pglite_migrated__) {
    globalThis.__pglite_migrated__ = true;
    globalThis.__pglite_db__
      .exec(`
        ALTER TABLE deudas ADD COLUMN IF NOT EXISTS user_id TEXT;
        ALTER TABLE bitacora_pagos ADD COLUMN IF NOT EXISTS user_id TEXT;
        ALTER TABLE configuracion_usuario ADD COLUMN IF NOT EXISTS user_id TEXT;
        ALTER TABLE movimientos_flujo ADD COLUMN IF NOT EXISTS user_id TEXT;
        UPDATE deudas SET user_id = 'u-admin' WHERE user_id IS NULL;
        UPDATE bitacora_pagos SET user_id = 'u-admin' WHERE user_id IS NULL;
        UPDATE configuracion_usuario SET user_id = 'u-admin' WHERE user_id IS NULL;
        UPDATE movimientos_flujo SET user_id = 'u-admin' WHERE user_id IS NULL;
      `)
      .catch(() => {
        // Ignorar si las tablas aún no se han inicializado
      });
  }

  return globalThis.__pglite_db__;
}
