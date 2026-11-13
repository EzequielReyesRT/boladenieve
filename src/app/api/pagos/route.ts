import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { BitacoraPago } from '@/types';

interface PagoRow {
  id: string;
  deuda_id: string;
  fecha_pago: string | Date;
  tipo_pago: 'Minimo' | 'Extra' | 'Anualidad' | 'Liquidacion';
  monto_total: string | number;
  intereses_cobrados: string | number | null;
  folio_comprobante: string | null;
  created_at: string;
}

export async function GET() {
  try {
    const db = getDb();
    const res = await db.query<PagoRow>('SELECT * FROM bitacora_pagos ORDER BY fecha_pago DESC');
    const pagos: BitacoraPago[] = res.rows.map((row) => ({
      id: row.id,
      deuda_id: row.deuda_id,
      fecha_pago: typeof row.fecha_pago === 'string' ? row.fecha_pago : new Date(row.fecha_pago).toISOString().split('T')[0],
      tipo_pago: row.tipo_pago,
      monto_total: Number(row.monto_total),
      intereses_cobrados: Number(row.intereses_cobrados || 0),
      folio_comprobante: row.folio_comprobante || undefined,
      created_at: row.created_at,
    }));

    return NextResponse.json(pagos);
  } catch (error) {
    console.error('Error fetching pagos from DB:', error);
    return NextResponse.json({ error: 'Error al consultar pagos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: BitacoraPago = await request.json();
    const db = getDb();
    const id = body.id || `p-${Date.now()}`;

    // 1. Guardar en bitácora de pagos
    await db.query(
      `
      INSERT INTO bitacora_pagos (
        id, deuda_id, fecha_pago, tipo_pago, monto_total, intereses_cobrados, folio_comprobante
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        id,
        body.deuda_id,
        body.fecha_pago,
        body.tipo_pago,
        body.monto_total,
        body.intereses_cobrados || 0,
        body.folio_comprobante || null,
      ]
    );

    // 2. Registrar automáticamente en movimientos_flujo como Gasto
    const deudaRes = await db.query<{ nombre_tarjeta: string }>(
      'SELECT nombre_tarjeta FROM deudas WHERE id = $1 LIMIT 1',
      [body.deuda_id]
    );
    const nombreTarjeta = deudaRes.rows[0]?.nombre_tarjeta || 'Tarjeta / Crédito';
    const flujoId = `flujo-pago-${id}`;
    const desc = `Abono a ${nombreTarjeta} (${body.tipo_pago})`;
    const cat = 'Pago de Tarjeta / Crédito';

    await db.query(
      `
      INSERT INTO movimientos_flujo (
        id, user_id, tipo, categoria, descripcion, monto, fecha, es_recurrente
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        monto = EXCLUDED.monto,
        fecha = EXCLUDED.fecha,
        descripcion = EXCLUDED.descripcion
      `,
      [
        flujoId,
        body.user_id || null,
        'Gasto',
        cat,
        desc,
        body.monto_total,
        body.fecha_pago,
        false,
      ]
    );

    // 3. Replicar a SQL Server si está disponible
    try {
      const { exec } = await import('child_process');
      const safeDesc = desc.replace(/'/g, "''");
      const safeCat = cat.replace(/'/g, "''");
      const folioVal = body.folio_comprobante ? `N'${body.folio_comprobante.replace(/'/g, "''")}'` : 'NULL';
      const sqlQuery = `
        IF NOT EXISTS (SELECT 1 FROM dbo.BitacoraPagos WHERE Id = N'${id}')
          INSERT INTO dbo.BitacoraPagos (Id, DeudaId, FechaPago, TipoPago, MontoTotal, InteresesCobrados, FolioComprobante)
          VALUES (N'${id}', N'${body.deuda_id}', '${body.fecha_pago}', N'${body.tipo_pago}', ${body.monto_total}, ${body.intereses_cobrados || 0}, ${folioVal});
        IF NOT EXISTS (SELECT 1 FROM dbo.MovimientosFlujo WHERE Id = N'${flujoId}')
          INSERT INTO dbo.MovimientosFlujo (Id, Tipo, Categoria, Descripcion, Monto, Fecha, EsRecurrente)
          VALUES (N'${flujoId}', N'Gasto', N'${safeCat}', N'${safeDesc}', ${body.monto_total}, '${body.fecha_pago}', 0);
      `;
      exec(`sqlcmd -S localhost\\SQLEXPRESS -U sa -P W81wocn21n -C -d BolaDeNieve -Q "${sqlQuery.replace(/\r?\n/g, ' ')}"`);
    } catch {
      // Ignorar si SQL Server no está disponible en este momento
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error inserting pago into DB:', error);
    return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    const db = getDb();
    const flujoId = `flujo-pago-${id}`;

    await db.query('DELETE FROM bitacora_pagos WHERE id = $1', [id]);
    await db.query('DELETE FROM movimientos_flujo WHERE id = $1', [flujoId]);

    try {
      const { exec } = await import('child_process');
      const sqlQuery = `
        DELETE FROM dbo.BitacoraPagos WHERE Id = N'${id}';
        DELETE FROM dbo.MovimientosFlujo WHERE Id = N'${flujoId}';
      `;
      exec(`sqlcmd -S localhost\\SQLEXPRESS -U sa -P W81wocn21n -C -d BolaDeNieve -Q "${sqlQuery.replace(/\r?\n/g, ' ')}"`);
    } catch {
      // Ignorar
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pago from DB:', error);
    return NextResponse.json({ error: 'Error al eliminar pago' }, { status: 500 });
  }
}
