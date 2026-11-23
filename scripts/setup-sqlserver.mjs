import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_SERVER = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const DB_USER = process.env.DB_USER || 'sa';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const sqlFile = path.resolve(__dirname, 'setup-sqlserver.sql');

if (!DB_PASSWORD) {
  console.error('❌ Error: DB_PASSWORD no está definida en las variables de entorno.');
  console.error('Por favor define DB_PASSWORD en tu entorno o en .env.local.');
  process.exit(1);
}

console.log(`🔌 Ejecutando setup de SQL Server en ${DB_SERVER} con usuario ${DB_USER}...`);
const child = execFile(
  'sqlcmd',
  ['-S', DB_SERVER, '-U', DB_USER, '-P', DB_PASSWORD, '-C', '-i', sqlFile],
  { shell: false },
  (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Error ejecutando setup SQL Server:', stderr || err.message);
      process.exit(1);
    }
    console.log(stdout);
    console.log('✅ Base de datos SQL Server configurada correctamente.');
  }
);
