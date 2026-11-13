import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Deuda } from '@/types';

interface DeudaRow {
  id: string;
  nombre_tarjeta: string;
  saldo_inicial: string | number;
  tasa_anual_porcentaje: string | number;
  pago_minimo: string | number;
  costo_anualidad: string | number | null;
  mes_cobro_anualidad: number | null;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const db = getDb();
    const res = await db.query<DeudaRow>('SELECT * FROM deudas ORDER BY saldo_inicial ASC');
    const deudas: Deuda[] = res.rows.map((row) => ({
      id: row.id,
      nombre_tarjeta: row.nombre_tarjeta,
      saldo_inicial: Number(row.saldo_inicial),
      tasa_anual_porcentaje: Number(row.tasa_anual_porcentaje),
      pago_minimo: Number(row.pago_minimo),
      costo_anualidad: Number(row.costo_anualidad || 0),
      mes_cobro_anualidad: Number(row.mes_cobro_anualidad || 1),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json(deudas);
  } catch (error) {
    console.error('Error fetching deudas from DB:', error);
    return NextResponse.json({ error: 'Error al consultar deudas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: Deuda = await request.json();
    const db = getDb();
    const id = body.id || `d-${Date.now()}`;

    await db.query(
      `
      INSERT INTO deudas (
        id, nombre_tarjeta, saldo_inicial, tasa_anual_porcentaje, pago_minimo, costo_anualidad, mes_cobro_anualidad
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        id,
        body.nombre_tarjeta,
        body.saldo_inicial,
        body.tasa_anual_porcentaje,
        body.pago_minimo,
        body.costo_anualidad || 0,
        body.mes_cobro_anualidad || 1,
      ]
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error inserting deuda into DB:', error);
    return NextResponse.json({ error: 'Error al agregar deuda' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: Deuda = await request.json();
    const db = getDb();

    await db.query(
      `
      UPDATE deudas SET
        nombre_tarjeta = $1,
        saldo_inicial = $2,
        tasa_anual_porcentaje = $3,
        pago_minimo = $4,
        costo_anualidad = $5,
        mes_cobro_anualidad = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `,
      [
        body.nombre_tarjeta,
        body.saldo_inicial,
        body.tasa_anual_porcentaje,
        body.pago_minimo,
        body.costo_anualidad || 0,
        body.mes_cobro_anualidad || 1,
        body.id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating deuda in DB:', error);
    return NextResponse.json({ error: 'Error al actualizar deuda' }, { status: 500 });
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
    await db.query('DELETE FROM deudas WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deuda from DB:', error);
    return NextResponse.json({ error: 'Error al eliminar deuda' }, { status: 500 });
  }
}
