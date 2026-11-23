import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { MovimientoFlujo } from '@/types';
import {
  syncMovimientoFlujoInsert,
  syncMovimientoFlujoUpdate,
  syncMovimientoFlujoDelete,
} from '@/lib/sqlserver';

interface MovimientoRow {
  id: string;
  user_id: string | null;
  tipo: string;
  categoria: string;
  descripcion: string;
  monto: string | number;
  fecha: string;
  es_recurrente: boolean | number;
  created_at: string;
  updated_at: string;
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const anio = searchParams.get('anio');

    const db = getDb();
    let query = 'SELECT * FROM movimientos_flujo';
    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (session.rol !== 'admin') {
      params.push(session.id);
      conditions.push(`user_id = $${params.length}`);
    }

    if (mes && anio) {
      params.push(parseInt(mes, 10));
      const mesIdx = params.length;
      params.push(parseInt(anio, 10));
      const anioIdx = params.length;
      conditions.push(`EXTRACT(MONTH FROM fecha::date) = $${mesIdx} AND EXTRACT(YEAR FROM fecha::date) = $${anioIdx}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY fecha DESC, created_at DESC';

    const res = await db.query<MovimientoRow>(query, params);

    const movimientos: MovimientoFlujo[] = res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id || undefined,
      tipo: row.tipo as 'Ingreso' | 'Gasto',
      categoria: row.categoria,
      descripcion: row.descripcion,
      monto: Number(row.monto),
      fecha: typeof row.fecha === 'string' ? row.fecha.split('T')[0] : new Date(row.fecha).toISOString().split('T')[0],
      es_recurrente: Boolean(row.es_recurrente),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json(movimientos);
  } catch (error) {
    console.error('Error fetching movimientos de flujo:', error);
    return NextResponse.json({ error: 'Error al consultar flujo de caja' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 });
    }

    const body: Partial<MovimientoFlujo> = await request.json();
    if (!body || !body.descripcion || body.monto === undefined || body.monto === null) {
      return NextResponse.json(
        { error: 'Descripción y monto son requeridos para registrar el movimiento.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = body.id || `flujo-${Date.now()}`;
    const monto = Number(body.monto) || 0;
    const esRecurrente = Boolean(body.es_recurrente);
    const fecha = body.fecha || new Date().toISOString().split('T')[0];
    const userId = session.id;

    // 1. Guardar en base de datos local PGlite
    await db.query(
      `
      INSERT INTO movimientos_flujo (
        id, user_id, tipo, categoria, descripcion, monto, fecha, es_recurrente
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        id,
        userId,
        body.tipo || 'Gasto',
        body.categoria || 'Varios',
        body.descripcion,
        monto,
        fecha,
        esRecurrente,
      ]
    );

    // 2. Replicar a SQL Server si está disponible (método seguro sin shell ni credenciales expuestas)
    await syncMovimientoFlujoInsert({
      id,
      tipo: body.tipo || 'Gasto',
      categoria: body.categoria || 'Varios',
      descripcion: body.descripcion,
      monto,
      fecha,
      es_recurrente: esRecurrente,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating movimiento de flujo:', error);
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 });
    }

    const body: Partial<MovimientoFlujo> = await request.json();
    if (!body || !body.id) {
      return NextResponse.json(
        { error: 'El ID del movimiento es requerido para actualizar.' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Prevención de IDOR: comprobar propiedad antes de actualizar
    const existing = await db.query<{ user_id?: string }>('SELECT user_id FROM movimientos_flujo WHERE id = $1', [body.id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    }

    if (
      session.rol !== 'admin' &&
      existing.rows[0].user_id &&
      existing.rows[0].user_id !== session.id
    ) {
      return NextResponse.json(
        { error: 'Acceso denegado: no tienes permiso para modificar este movimiento.' },
        { status: 403 }
      );
    }

    const monto = Number(body.monto) || 0;
    const esRecurrente = Boolean(body.es_recurrente);
    const fecha = body.fecha || new Date().toISOString().split('T')[0];

    // 1. Actualizar en PGlite
    await db.query(
      `
      UPDATE movimientos_flujo SET
        tipo = $1,
        categoria = $2,
        descripcion = $3,
        monto = $4,
        fecha = $5,
        es_recurrente = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      `,
      [
        body.tipo || 'Gasto',
        body.categoria || 'Varios',
        body.descripcion || '',
        monto,
        fecha,
        esRecurrente,
        body.id,
      ]
    );

    // 2. Replicar actualización a SQL Server de forma segura
    await syncMovimientoFlujoUpdate({
      id: body.id,
      tipo: body.tipo || 'Gasto',
      categoria: body.categoria || 'Varios',
      descripcion: body.descripcion || '',
      monto,
      fecha,
      es_recurrente: esRecurrente,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating movimiento de flujo:', error);
    return NextResponse.json({ error: 'Error al actualizar movimiento' }, { status: 500 });
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

    // Prevención de IDOR: comprobar propiedad antes de eliminar
    const existing = await db.query<{ user_id?: string }>('SELECT user_id FROM movimientos_flujo WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    }

    if (
      session.rol !== 'admin' &&
      existing.rows[0].user_id &&
      existing.rows[0].user_id !== session.id
    ) {
      return NextResponse.json(
        { error: 'Acceso denegado: no tienes permiso para eliminar este movimiento.' },
        { status: 403 }
      );
    }

    await db.query('DELETE FROM movimientos_flujo WHERE id = $1', [id]);

    // Replicar eliminación a SQL Server de forma segura
    await syncMovimientoFlujoDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting movimiento de flujo:', error);
    return NextResponse.json({ error: 'Error al eliminar movimiento' }, { status: 500 });
  }
}
