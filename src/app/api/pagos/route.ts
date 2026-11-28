import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { validatePago } from '@/lib/validation';
import { BitacoraPago } from '@/types';
import { syncPagoInsert, syncPagoDelete } from '@/lib/sqlserver';

interface PagoRow {
  id: string;
  deuda_id: string;
  user_id?: string;
  fecha_pago: string | Date;
  tipo_pago: 'Minimo' | 'Extra' | 'Anualidad' | 'Liquidacion';
  monto_total: string | number;
  intereses_cobrados: string | number | null;
  folio_comprobante: string | null;
  created_at: string;
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 });
    }

    const db = getDb();
    const res = await db.query<PagoRow>(
      'SELECT * FROM bitacora_pagos WHERE user_id = $1 ORDER BY fecha_pago DESC',
      [session.id]
    );
    const pagos: BitacoraPago[] = res.rows.map((row) => ({
      id: row.id,
      deuda_id: row.deuda_id,
      user_id: row.user_id,
      fecha_pago: typeof row.fecha_pago === 'string' ? row.fecha_pago : new Date(row.fecha_pago).toISOString().split('T')[0],
      tipo_pago: row.tipo_pago,
      monto_total: Number(row.monto_total),
      intereses_cobrados: Number(row.intereses_cobrados || 0),
      folio_comprobante: row.folio_comprobante || undefined,
      created_at: row.created_at,
    }));

    return NextResponse.json(pagos, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
    });
  } catch (error) {
    console.error('Error fetching pagos from DB:', error);
    return NextResponse.json({ error: 'Error al consultar pagos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 });
    }

    const rawBody: Partial<BitacoraPago> = await request.json();
    const validation = validatePago(rawBody);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Datos de pago inválidos', details: validation.errors },
        { status: 400 }
      );
    }

    const { data } = validation;
    const db = getDb();
    const id = data.id || `p-${Date.now()}`;
    const userId = session.id;

    // Prevención de IDOR: comprobar que la deuda destino pertenece al usuario autenticado
    const deudaRes = await db.query<{ nombre_tarjeta: string; user_id?: string }>(
      'SELECT nombre_tarjeta, user_id FROM deudas WHERE id = $1 LIMIT 1',
      [data.deuda_id]
    );

    if (deudaRes.rows.length === 0) {
      return NextResponse.json({ error: 'La deuda especificada no existe.' }, { status: 404 });
    }

    if (deudaRes.rows[0].user_id !== session.id) {
      return NextResponse.json(
        { error: 'Acceso denegado: no puedes registrar pagos para deudas de otro usuario.' },
        { status: 403 }
      );
    }

    const nombreTarjeta = deudaRes.rows[0]?.nombre_tarjeta || 'Tarjeta / Crédito';

    // 1. Guardar en bitácora de pagos
    await db.query(
      `
      INSERT INTO bitacora_pagos (
        id, deuda_id, user_id, fecha_pago, tipo_pago, monto_total, intereses_cobrados, folio_comprobante
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        id,
        data.deuda_id,
        userId,
        data.fecha_pago,
        data.tipo_pago,
        data.monto_total,
        data.intereses_cobrados,
        data.folio_comprobante || null,
      ]
    );

    // 2. Registrar automáticamente en movimientos_flujo como Gasto
    const flujoId = `flujo-pago-${id}`;
    const desc = `Abono a ${nombreTarjeta} (${data.tipo_pago})`;
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
        userId,
        'Gasto',
        cat,
        desc,
        data.monto_total,
        data.fecha_pago,
        false,
      ]
    );

    // 3. Replicar a SQL Server si está disponible (método seguro sin shell ni credenciales expuestas)
    await syncPagoInsert(data, nombreTarjeta);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error inserting pago into DB:', error);
    return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    const db = getDb();

    // Prevención de IDOR: verificar propiedad del pago antes de eliminar
    const existing = await db.query<{ user_id?: string }>('SELECT user_id FROM bitacora_pagos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    if (existing.rows[0].user_id !== session.id) {
      return NextResponse.json(
        { error: 'Acceso denegado: no tienes permiso para eliminar este pago.' },
        { status: 403 }
      );
    }

    const flujoId = `flujo-pago-${id}`;

    await db.query('DELETE FROM bitacora_pagos WHERE id = $1', [id]);
    await db.query('DELETE FROM movimientos_flujo WHERE id = $1', [flujoId]);

    // Replicar eliminación a SQL Server de forma segura
    await syncPagoDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pago from DB:', error);
    return NextResponse.json({ error: 'Error al eliminar pago' }, { status: 500 });
  }
}
