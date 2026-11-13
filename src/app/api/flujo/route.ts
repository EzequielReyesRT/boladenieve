import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { MovimientoFlujo } from '@/types';

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
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const anio = searchParams.get('anio');

    const db = getDb();
    let query = 'SELECT * FROM movimientos_flujo ORDER BY fecha DESC, created_at DESC';
    const params: (string | number)[] = [];

    if (mes && anio) {
      query = `
        SELECT * FROM movimientos_flujo
        WHERE EXTRACT(MONTH FROM fecha::date) = $1 AND EXTRACT(YEAR FROM fecha::date) = $2
        ORDER BY fecha DESC, created_at DESC
      `;
      params.push(parseInt(mes, 10), parseInt(anio, 10));
    }

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
    const body = await request.json();
    const db = getDb();
    const id = body.id || `flujo-${Date.now()}`;
    const monto = Number(body.monto) || 0;
    const esRecurrente = Boolean(body.es_recurrente);
    const fecha = body.fecha || new Date().toISOString().split('T')[0];

    // 1. Guardar en base de datos local PGlite
    await db.query(
      `
      INSERT INTO movimientos_flujo (
        id, user_id, tipo, categoria, descripcion, monto, fecha, es_recurrente
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        id,
        body.user_id || null,
        body.tipo,
        body.categoria,
        body.descripcion,
        monto,
        fecha,
        esRecurrente,
      ]
    );

    // 2. Replicar a SQL Server si está disponible
    try {
      const { exec } = await import('child_process');
      const safeDesc = (body.descripcion || '').replace(/'/g, "''");
      const safeCat = (body.categoria || '').replace(/'/g, "''");
      const safeTipo = (body.tipo || 'Gasto').replace(/'/g, "''");
      const recBit = esRecurrente ? 1 : 0;
      const sqlQuery = `INSERT INTO dbo.MovimientosFlujo (Id, Tipo, Categoria, Descripcion, Monto, Fecha, EsRecurrente) VALUES (N'${id}', N'${safeTipo}', N'${safeCat}', N'${safeDesc}', ${monto}, '${fecha}', ${recBit});`;
      exec(`sqlcmd -S localhost\\SQLEXPRESS -U sa -P W81wocn21n -C -d BolaDeNieve -Q "${sqlQuery}"`);
    } catch {
      // Ignorar si SQL Server no está disponible en este momento
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating movimiento de flujo:', error);
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
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
        body.tipo,
        body.categoria,
        body.descripcion,
        monto,
        fecha,
        esRecurrente,
        body.id,
      ]
    );

    // 2. Replicar actualización a SQL Server
    try {
      const { exec } = await import('child_process');
      const safeDesc = (body.descripcion || '').replace(/'/g, "''");
      const safeCat = (body.categoria || '').replace(/'/g, "''");
      const safeTipo = (body.tipo || 'Gasto').replace(/'/g, "''");
      const recBit = esRecurrente ? 1 : 0;
      const sqlQuery = `UPDATE dbo.MovimientosFlujo SET Tipo = N'${safeTipo}', Categoria = N'${safeCat}', Descripcion = N'${safeDesc}', Monto = ${monto}, Fecha = '${fecha}', EsRecurrente = ${recBit}, UpdatedAt = SYSUTCDATETIME() WHERE Id = N'${body.id}';`;
      exec(`sqlcmd -S localhost\\SQLEXPRESS -U sa -P W81wocn21n -C -d BolaDeNieve -Q "${sqlQuery}"`);
    } catch {
      // Ignorar error de réplica
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating movimiento de flujo:', error);
    return NextResponse.json({ error: 'Error al actualizar movimiento' }, { status: 500 });
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
    await db.query('DELETE FROM movimientos_flujo WHERE id = $1', [id]);

    try {
      const { exec } = await import('child_process');
      exec(`sqlcmd -S localhost\\SQLEXPRESS -U sa -P W81wocn21n -C -d BolaDeNieve -Q "DELETE FROM dbo.MovimientosFlujo WHERE Id = N'${id}';"`);
    } catch {
      // Ignorar error de réplica
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting movimiento de flujo:', error);
    return NextResponse.json({ error: 'Error al eliminar movimiento' }, { status: 500 });
  }
}
