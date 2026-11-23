import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { validateDeuda } from '@/lib/validation';
import { Deuda } from '@/types';

interface DeudaRow {
  id: string;
  user_id?: string;
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
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 });
    }

    const db = getDb();
    const query =
      session.rol === 'admin'
        ? 'SELECT * FROM deudas ORDER BY saldo_inicial ASC'
        : 'SELECT * FROM deudas WHERE user_id = $1 ORDER BY saldo_inicial ASC';
    const params = session.rol === 'admin' ? [] : [session.id];

    const res = await db.query<DeudaRow>(query, params);
    const deudas: Deuda[] = res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
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
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 });
    }

    const rawBody: Partial<Deuda> = await request.json();
    const validation = validateDeuda(rawBody);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Datos de deuda inválidos', details: validation.errors },
        { status: 400 }
      );
    }

    const { data } = validation;
    const db = getDb();
    const id = data.id || `d-${Date.now()}`;
    const userId = session.id;

    await db.query(
      `
      INSERT INTO deudas (
        id, user_id, nombre_tarjeta, saldo_inicial, tasa_anual_porcentaje, pago_minimo, costo_anualidad, mes_cobro_anualidad
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        id,
        userId,
        data.nombre_tarjeta,
        data.saldo_inicial,
        data.tasa_anual_porcentaje,
        data.pago_minimo,
        data.costo_anualidad,
        data.mes_cobro_anualidad,
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
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 });
    }

    const rawBody: Partial<Deuda> = await request.json();
    if (!rawBody || !rawBody.id) {
      return NextResponse.json({ error: 'El ID de la deuda es requerido para actualizar.' }, { status: 400 });
    }

    const validation = validateDeuda(rawBody);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Datos de deuda inválidos', details: validation.errors },
        { status: 400 }
      );
    }

    const { data } = validation;
    const db = getDb();

    // Prevención de IDOR: verificar propiedad del recurso
    const existing = await db.query<DeudaRow>('SELECT id, user_id FROM deudas WHERE id = $1', [data.id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Deuda no encontrada' }, { status: 404 });
    }

    if (
      session.rol !== 'admin' &&
      existing.rows[0].user_id &&
      existing.rows[0].user_id !== session.id
    ) {
      return NextResponse.json(
        { error: 'Acceso denegado: no tienes permiso para modificar este recurso.' },
        { status: 403 }
      );
    }

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
        data.nombre_tarjeta,
        data.saldo_inicial,
        data.tasa_anual_porcentaje,
        data.pago_minimo,
        data.costo_anualidad,
        data.mes_cobro_anualidad,
        data.id,
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

    // Prevención de IDOR: verificar propiedad del recurso
    const existing = await db.query<DeudaRow>('SELECT id, user_id FROM deudas WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Deuda no encontrada' }, { status: 404 });
    }

    if (
      session.rol !== 'admin' &&
      existing.rows[0].user_id &&
      existing.rows[0].user_id !== session.id
    ) {
      return NextResponse.json(
        { error: 'Acceso denegado: no tienes permiso para eliminar este recurso.' },
        { status: 403 }
      );
    }

    await db.query('DELETE FROM deudas WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deuda from DB:', error);
    return NextResponse.json({ error: 'Error al eliminar deuda' }, { status: 500 });
  }
}
