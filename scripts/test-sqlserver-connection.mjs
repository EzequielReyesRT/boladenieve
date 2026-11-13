import sql from 'mssql';

const sqlConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'W81wocn21n',
  database: process.env.DB_NAME || 'BolaDeNieve',
  server: process.env.DB_SERVER || 'localhost',
  options: {
    instanceName: process.env.DB_INSTANCE || 'SQLEXPRESS',
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function test() {
  try {
    console.log('🔌 Conectando a SQL Server localhost\\SQLEXPRESS con mssql...');
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query('SELECT COUNT(*) as total FROM Deudas');
    console.log('✅ Conexión a SQL Server exitosa!');
    console.log(`📊 Deudas en base de datos productiva: ${result.recordset[0].total}`);
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error conectando a SQL Server:', err);
    process.exit(1);
  }
}

test();
