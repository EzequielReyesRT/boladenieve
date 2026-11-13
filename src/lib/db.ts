import { PGlite } from '@electric-sql/pglite';
import path from 'path';

declare global {
  var __pglite_db__: PGlite | undefined;
}

export function getDb(): PGlite {
  if (!globalThis.__pglite_db__) {
    const dbPath = path.resolve(process.cwd(), 'dev-db');
    globalThis.__pglite_db__ = new PGlite(dbPath);
  }
  return globalThis.__pglite_db__;
}
