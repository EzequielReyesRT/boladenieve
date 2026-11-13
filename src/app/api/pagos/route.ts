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
    await db.query('DELETE FROM bitacora_pagos WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pago from DB:', error);
    return NextResponse.json({ error: 'Error al eliminar pago' }, { status: 500 });
  }
}
