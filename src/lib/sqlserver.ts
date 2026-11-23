import { execFile } from 'child_process';

const DB_SERVER = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const DB_USER = process.env.DB_USER || 'sa';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'BolaDeNieve';

/**
 * Escapa comillas simples para literales SQL
 */
function escapeSqlString(val: string): string {
  return (val || '').replace(/'/g, "''");
}

/**
 * Limpia identificadores para permitir solo caracteres seguros alfanuméricos y guiones
 */
function sanitizeIdentifier(id: string): string {
  return (id || '').replace(/[^a-zA-Z0-9_\-]/g, '');
}

/**
 * Ejecuta una consulta en SQL Server de manera segura:
 * 1. Usa execFile con { shell: false } directamente sobre el binario sqlcmd (cero invocación de cmd.exe).
 * 2. La consulta SQL se transmite a través del flujo stdin del proceso, eliminando
 *    posibilidad de inyección en la línea de comandos del SO y evitando que la consulta
 *    sea visible en la tabla de procesos de Windows.
 * 3. Las credenciales se leen exclusivamente desde variables de entorno.
 */
export async function executeSqlServerQuery(query: string): Promise<boolean> {
  // En entornos de nube (ej. Vercel) donde no hay SQL Server local ni DB_PASSWORD, salir silenciosamente
  if (!DB_PASSWORD) {
    return false;
  }

  return new Promise((resolve) => {
    try {
      const child = execFile(
        'sqlcmd',
        ['-S', DB_SERVER, '-U', DB_USER, '-P', DB_PASSWORD, '-C', '-d', DB_NAME, '-b'],
        { shell: false, windowsHide: true },
        (err) => {
          if (err) {
            // Error controlado de conexión o ejecución
            resolve(false);
          } else {
            resolve(true);
          }
        }
      );

      child.on('error', () => {
        // sqlcmd no disponible en el host
        resolve(false);
      });

      if (child.stdin) {
        child.stdin.write(query + '\nGO\n');
        child.stdin.end();
      } else {
        resolve(false);
      }
    } catch {
      resolve(false);
    }
  });
}

/**
 * Sincroniza la inserción de un movimiento de flujo de caja en SQL Server
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
  const safeId = sanitizeIdentifier(mov.id);
  const safeTipo = escapeSqlString(mov.tipo || 'Gasto');
  const safeCat = escapeSqlString(mov.categoria || 'General');
  const safeDesc = escapeSqlString(mov.descripcion || '');
  const monto = Number(mov.monto) || 0;
  const safeFecha = escapeSqlString(mov.fecha || new Date().toISOString().split('T')[0]);
  const recBit = mov.es_recurrente ? 1 : 0;

  const query = `
    IF NOT EXISTS (SELECT 1 FROM dbo.MovimientosFlujo WHERE Id = N'${safeId}')
      INSERT INTO dbo.MovimientosFlujo (Id, Tipo, Categoria, Descripcion, Monto, Fecha, EsRecurrente)
      VALUES (N'${safeId}', N'${safeTipo}', N'${safeCat}', N'${safeDesc}', ${monto}, '${safeFecha}', ${recBit});
    ELSE
      UPDATE dbo.MovimientosFlujo
      SET Tipo = N'${safeTipo}', Categoria = N'${safeCat}', Descripcion = N'${safeDesc}', Monto = ${monto}, Fecha = '${safeFecha}', EsRecurrente = ${recBit}, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = N'${safeId}';
  `;

  return executeSqlServerQuery(query);
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
  const safeId = sanitizeIdentifier(mov.id);
  const safeTipo = escapeSqlString(mov.tipo || 'Gasto');
  const safeCat = escapeSqlString(mov.categoria || 'General');
  const safeDesc = escapeSqlString(mov.descripcion || '');
  const monto = Number(mov.monto) || 0;
  const safeFecha = escapeSqlString(mov.fecha || new Date().toISOString().split('T')[0]);
  const recBit = mov.es_recurrente ? 1 : 0;

  const query = `
    UPDATE dbo.MovimientosFlujo
    SET Tipo = N'${safeTipo}', Categoria = N'${safeCat}', Descripcion = N'${safeDesc}', Monto = ${monto}, Fecha = '${safeFecha}', EsRecurrente = ${recBit}, UpdatedAt = SYSUTCDATETIME()
    WHERE Id = N'${safeId}';
  `;

  return executeSqlServerQuery(query);
}

/**
 * Sincroniza la eliminación de un movimiento de flujo de caja en SQL Server
 */
export async function syncMovimientoFlujoDelete(id: string): Promise<boolean> {
  const safeId = sanitizeIdentifier(id);
  const query = `DELETE FROM dbo.MovimientosFlujo WHERE Id = N'${safeId}';`;
  return executeSqlServerQuery(query);
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
  const safeId = sanitizeIdentifier(pago.id);
  const safeDeudaId = sanitizeIdentifier(pago.deuda_id);
  const safeFecha = escapeSqlString(pago.fecha_pago);
  const safeTipoPago = escapeSqlString(pago.tipo_pago);
  const montoTotal = Number(pago.monto_total) || 0;
  const intereses = Number(pago.intereses_cobrados) || 0;
  const folioVal = pago.folio_comprobante ? `N'${escapeSqlString(pago.folio_comprobante)}'` : 'NULL';

  const flujoId = `flujo-pago-${safeId}`;
  const safeDesc = escapeSqlString(`Abono a ${nombreTarjeta} (${pago.tipo_pago})`);
  const safeCat = escapeSqlString('Pago de Tarjeta / Crédito');

  const query = `
    IF NOT EXISTS (SELECT 1 FROM dbo.BitacoraPagos WHERE Id = N'${safeId}')
      INSERT INTO dbo.BitacoraPagos (Id, DeudaId, FechaPago, TipoPago, MontoTotal, InteresesCobrados, FolioComprobante)
      VALUES (N'${safeId}', N'${safeDeudaId}', '${safeFecha}', N'${safeTipoPago}', ${montoTotal}, ${intereses}, ${folioVal});

    IF NOT EXISTS (SELECT 1 FROM dbo.MovimientosFlujo WHERE Id = N'${flujoId}')
      INSERT INTO dbo.MovimientosFlujo (Id, Tipo, Categoria, Descripcion, Monto, Fecha, EsRecurrente)
      VALUES (N'${flujoId}', N'Gasto', N'${safeCat}', N'${safeDesc}', ${montoTotal}, '${safeFecha}', 0);
  `;

  return executeSqlServerQuery(query);
}

/**
 * Sincroniza la eliminación de un pago y su movimiento de flujo asociado en SQL Server
 */
export async function syncPagoDelete(pagoId: string): Promise<boolean> {
  const safeId = sanitizeIdentifier(pagoId);
  const flujoId = `flujo-pago-${safeId}`;

  const query = `
    DELETE FROM dbo.BitacoraPagos WHERE Id = N'${safeId}';
    DELETE FROM dbo.MovimientosFlujo WHERE Id = N'${flujoId}';
  `;

  return executeSqlServerQuery(query);
}
