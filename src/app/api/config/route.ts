import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ConfiguracionUsuario } from '@/types';

export async function GET() {
  try {
    const db = getDb();
    const res = await db.query<ConfiguracionUsuario>(
      'SELECT * FROM configuracion_usuario LIMIT 1'
    );
    if (res.rows.length === 0) {
      return NextResponse.json(null);
    }
    const row = res.rows[0];
    return NextResponse.json({
      ...row,
      pago_extra_mensual: Number(row.pago_extra_mensual),
      mes_calendario_inicio: Number(row.mes_calendario_inicio),
      anio_inicio: Number(row.anio_inicio || 2026),
      aportacion_unica_anual: Number(row.aportacion_unica_anual),
      mes_aportacion_unica: Number(row.mes_aportacion_unica),
    });
  } catch (error) {
    console.error('Error fetching config from DB:', error);
    return NextResponse.json({ error: 'Error al consultar configuración' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: ConfiguracionUsuario = await request.json();
    const db = getDb();

    await db.query(
      `
      INSERT INTO configuracion_usuario (
        id, pago_extra_mensual, mes_calendario_inicio, anio_inicio, aportacion_unica_anual, mes_aportacion_unica, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        pago_extra_mensual = EXCLUDED.pago_extra_mensual,
        mes_calendario_inicio = EXCLUDED.mes_calendario_inicio,
        anio_inicio = EXCLUDED.anio_inicio,
        aportacion_unica_anual = EXCLUDED.aportacion_unica_anual,
        mes_aportacion_unica = EXCLUDED.mes_aportacion_unica,
        updated_at = CURRENT_TIMESTAMP;
    `,
      [
        body.id || 'config-default',
        body.pago_extra_mensual || 0,
        body.mes_calendario_inicio || 1,
        body.anio_inicio || 2026,
        body.aportacion_unica_anual || 0,
        body.mes_aportacion_unica || 12,
      ]
    );

    return NextResponse.json({ success: true, config: body });
  } catch (error) {
    console.error('Error updating config in DB:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
