import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { validateMovimientoFlujo } from '@/lib/validation';
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
    const params: (string | number)[] = [session.id];
    const conditions: string[] = ['user_id = $1'];

    if (mes && anio) {
      params.push(parseInt(mes, 10));
      const mesIdx = params.length;
      params.push(parseInt(anio, 10));
      const anioIdx = params.length;
      conditions.push(`EXTRACT(MONTH FROM fecha::date) = $${mesIdx} AND EXTRACT(YEAR FROM fecha::date) = $${anioIdx}`);
    }

    query += ' WHERE ' + conditions.join(' AND ');
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

    return NextResponse.json(movimientos, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
    });
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

    const rawBody: Partial<MovimientoFlujo> = await request.json();
    const validation = validateMovimientoFlujo(rawBody);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Datos de movimiento inválidos', details: validation.errors },
        { status: 400 }
      );
    }

    const { data } = validation;
    const db = getDb();
    const id = data.id || `flujo-${Date.now()}`;
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
        data.tipo,
        data.categoria,
        data.descripcion,
        data.monto,
        data.fecha,
        data.es_recurrente,
      ]
    );

    // 2. Replicar a SQL Server si está disponible (método seguro sin shell ni credenciales expuestas)
    await syncMovimientoFlujoInsert({
      id,
      tipo: data.tipo,
      categoria: data.categoria,
      descripcion: data.descripcion,
      monto: data.monto,
      fecha: data.fecha,
      es_recurrente: data.es_recurrente,
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

    const rawBody: Partial<MovimientoFlujo> = await request.json();
    if (!rawBody || !rawBody.id) {
      return NextResponse.json(
        { error: 'El ID del movimiento es requerido para actualizar.' },
        { status: 400 }
      );
    }

    const validation = validateMovimientoFlujo(rawBody);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Datos de movimiento inválidos', details: validation.errors },
        { status: 400 }
      );
    }

    const { data } = validation;
    const db = getDb();

    // Prevención de IDOR: comprobar propiedad antes de actualizar
    const existing = await db.query<{ user_id?: string }>('SELECT user_id FROM movimientos_flujo WHERE id = $1', [data.id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    }

    if (existing.rows[0].user_id !== session.id) {
      return NextResponse.json(
        { error: 'Acceso denegado: no tienes permiso para modificar este movimiento.' },
        { status: 403 }
      );
    }

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
        data.tipo,
        data.categoria,
        data.descripcion,
        data.monto,
        data.fecha,
        data.es_recurrente,
        data.id,
      ]
    );

    // 2. Replicar actualización a SQL Server de forma segura
    await syncMovimientoFlujoUpdate({
      id: data.id,
      tipo: data.tipo,
      categoria: data.categoria,
      descripcion: data.descripcion,
      monto: data.monto,
      fecha: data.fecha,
      es_recurrente: data.es_recurrente,
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

    if (existing.rows[0].user_id !== session.id) {
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
