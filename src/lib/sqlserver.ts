import sql from 'mssql';

let poolPromise: Promise<sql.ConnectionPool | null> | null = null;

function getSqlConfig(): sql.config | null {
  const password = process.env.DB_PASSWORD;
  if (!password) return null;

  const rawServer = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
  let server = rawServer;
  let instanceName = process.env.DB_INSTANCE || undefined;

  // Si DB_SERVER contiene una barra invertida (ej. localhost\SQLEXPRESS)
  if (rawServer.includes('\\')) {
    const parts = rawServer.split('\\');
    server = parts[0];
    instanceName = parts[1];
  }

  return {
    user: process.env.DB_USER || 'sa',
    password: password,
    server: server,
    database: process.env.DB_NAME || 'BolaDeNieve',
    options: {
      instanceName: instanceName,
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 5000,
      requestTimeout: 10000,
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

async function getPool(): Promise<sql.ConnectionPool | null> {
  const config = getSqlConfig();
  if (!config) return null;

  if (poolPromise) {
    try {
      const existing = await poolPromise;
      if (existing && !existing.connected && !existing.connecting) {
        poolPromise = null;
      }
    } catch {
      poolPromise = null;
    }
  }

  if (!poolPromise) {
    poolPromise = sql
      .connect(config)
      .then((pool) => pool)
      .catch((err) => {
        console.warn('Advertencia al conectar con SQL Server via TDS:', err?.message || err);
        poolPromise = null;
        return null;
      });
  }

  return poolPromise;
}

/**
 * Ejecuta una consulta arbitraria en SQL Server de forma controlada a través del pool TDS
 */
export async function executeSqlServerQuery(query: string): Promise<boolean> {
  try {
    const pool = await getPool();
    if (!pool) return false;
    await pool.request().query(query);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sincroniza la inserción de un movimiento de flujo de caja en SQL Server con consultas parametrizadas
 */
export async function syncMovimientoFlujoInsert(mov: {
  id: string;
  tipo: string;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  es_recurrente: boolean;
}): Promise<boolean> {
  try {
    const pool = await getPool();
    if (!pool) return false;

    const request = pool.request();
    request.input('id', sql.NVarChar(60), mov.id);
    request.input('tipo', sql.NVarChar(20), mov.tipo || 'Gasto');
    request.input('categoria', sql.NVarChar(80), mov.categoria || 'General');
    request.input('descripcion', sql.NVarChar(150), mov.descripcion || '');
    request.input('monto', sql.Decimal(12, 2), Number(mov.monto) || 0);
    request.input('fecha', sql.Date, mov.fecha || new Date().toISOString().split('T')[0]);
    request.input('esRecurrente', sql.Bit, mov.es_recurrente ? 1 : 0);

    await request.query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.MovimientosFlujo WHERE Id = @id)
        INSERT INTO dbo.MovimientosFlujo (Id, Tipo, Categoria, Descripcion, Monto, Fecha, EsRecurrente)
        VALUES (@id, @tipo, @categoria, @descripcion, @monto, @fecha, @esRecurrente);
      ELSE
        UPDATE dbo.MovimientosFlujo
        SET Tipo = @tipo, Categoria = @categoria, Descripcion = @descripcion, Monto = @monto, Fecha = @fecha, EsRecurrente = @esRecurrente, UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id;
    `);

    return true;
  } catch (err) {
    console.warn('Error al sincronizar movimiento con SQL Server:', err);
    return false;
  }
}

/**
 * Sincroniza la actualización de un movimiento de flujo de caja en SQL Server
 */
export async function syncMovimientoFlujoUpdate(mov: {
  id: string;
  tipo: string;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  es_recurrente: boolean;
}): Promise<boolean> {
  try {
    const pool = await getPool();
    if (!pool) return false;

    const request = pool.request();
    request.input('id', sql.NVarChar(60), mov.id);
    request.input('tipo', sql.NVarChar(20), mov.tipo || 'Gasto');
    request.input('categoria', sql.NVarChar(80), mov.categoria || 'General');
    request.input('descripcion', sql.NVarChar(150), mov.descripcion || '');
    request.input('monto', sql.Decimal(12, 2), Number(mov.monto) || 0);
    request.input('fecha', sql.Date, mov.fecha || new Date().toISOString().split('T')[0]);
    request.input('esRecurrente', sql.Bit, mov.es_recurrente ? 1 : 0);

    await request.query(`
      UPDATE dbo.MovimientosFlujo
      SET Tipo = @tipo, Categoria = @categoria, Descripcion = @descripcion, Monto = @monto, Fecha = @fecha, EsRecurrente = @esRecurrente, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id;
    `);

    return true;
  } catch (err) {
    console.warn('Error al actualizar movimiento en SQL Server:', err);
    return false;
  }
}

/**
 * Sincroniza la eliminación de un movimiento de flujo de caja en SQL Server
 */
export async function syncMovimientoFlujoDelete(id: string): Promise<boolean> {
  try {
    const pool = await getPool();
    if (!pool) return false;

    const request = pool.request();
    request.input('id', sql.NVarChar(60), id);
    await request.query('DELETE FROM dbo.MovimientosFlujo WHERE Id = @id;');
    return true;
  } catch (err) {
    console.warn('Error al eliminar movimiento en SQL Server:', err);
    return false;
  }
}

/**
 * Sincroniza la inserción de un pago y su movimiento de flujo asociado en SQL Server
 */
export async function syncPagoInsert(
  pago: {
    id: string;
    deuda_id: string;
    fecha_pago: string;
    tipo_pago: string;
    monto_total: number;
    intereses_cobrados?: number;
    folio_comprobante?: string;
  },
  nombreTarjeta: string
): Promise<boolean> {
  try {
    const pool = await getPool();
    if (!pool) return false;

    const safeId = pago.id;
    const flujoId = `flujo-pago-${safeId}`;
    const desc = `Abono a ${nombreTarjeta} (${pago.tipo_pago})`;
    const cat = 'Pago de Tarjeta / Crédito';

    const request = pool.request();
    request.input('id', sql.NVarChar(60), safeId);
    request.input('deudaId', sql.NVarChar(60), pago.deuda_id);
    request.input('fechaPago', sql.Date, pago.fecha_pago);
    request.input('tipoPago', sql.NVarChar(20), pago.tipo_pago);
    request.input('montoTotal', sql.Decimal(12, 2), Number(pago.monto_total) || 0);
    request.input('interesesCobrados', sql.Decimal(12, 2), Number(pago.intereses_cobrados) || 0);
    request.input('folioComprobante', sql.NVarChar(100), pago.folio_comprobante || null);

    request.input('flujoId', sql.NVarChar(60), flujoId);
    request.input('flujoTipo', sql.NVarChar(20), 'Gasto');
    request.input('flujoCat', sql.NVarChar(80), cat);
    request.input('flujoDesc', sql.NVarChar(150), desc);

    await request.query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.BitacoraPagos WHERE Id = @id)
        INSERT INTO dbo.BitacoraPagos (Id, DeudaId, FechaPago, TipoPago, MontoTotal, InteresesCobrados, FolioComprobante)
        VALUES (@id, @deudaId, @fechaPago, @tipoPago, @montoTotal, @interesesCobrados, @folioComprobante);

      IF NOT EXISTS (SELECT 1 FROM dbo.MovimientosFlujo WHERE Id = @flujoId)
        INSERT INTO dbo.MovimientosFlujo (Id, Tipo, Categoria, Descripcion, Monto, Fecha, EsRecurrente)
        VALUES (@flujoId, @flujoTipo, @flujoCat, @flujoDesc, @montoTotal, @fechaPago, 0);
    `);

    return true;
  } catch (err) {
    console.warn('Error al insertar pago en SQL Server:', err);
    return false;
  }
}

/**
 * Sincroniza la eliminación de un pago y su movimiento de flujo asociado en SQL Server
 */
export async function syncPagoDelete(pagoId: string): Promise<boolean> {
  try {
    const pool = await getPool();
    if (!pool) return false;

    const flujoId = `flujo-pago-${pagoId}`;
    const request = pool.request();
    request.input('id', sql.NVarChar(60), pagoId);
    request.input('flujoId', sql.NVarChar(60), flujoId);

    await request.query(`
      DELETE FROM dbo.BitacoraPagos WHERE Id = @id;
      DELETE FROM dbo.MovimientosFlujo WHERE Id = @flujoId;
    `);

    return true;
  } catch (err) {
    console.warn('Error al eliminar pago en SQL Server:', err);
    return false;
  }
}
