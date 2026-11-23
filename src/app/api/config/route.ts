import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { ConfiguracionUsuario } from '@/types';

interface ConfigRow {
  id: string;
  user_id?: string;
  pago_extra_mensual: string | number;
  mes_calendario_inicio: string | number;
  anio_inicio: string | number;
  aportacion_unica_anual: string | number;
  mes_aportacion_unica: string | number;
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
    let res = await db.query<ConfigRow>(
      'SELECT * FROM configuracion_usuario WHERE user_id = $1 LIMIT 1',
      [session.id]
    );

    // Si es admin y no tiene configuración individual específica, usar la configuración general existente
    if (res.rows.length === 0 && session.rol === 'admin') {
      res = await db.query<ConfigRow>('SELECT * FROM configuracion_usuario LIMIT 1');
    }

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
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 });
    }

    const body: ConfiguracionUsuario = await request.json();
    const db = getDb();
    const configId = body.id || `config-${session.id}`;

    // Prevención de IDOR: si se proporciona un ID existente, verificar propiedad
    if (body.id) {
      const existing = await db.query<{ user_id?: string }>(
        'SELECT user_id FROM configuracion_usuario WHERE id = $1',
        [body.id]
      );
      if (
        existing.rows.length > 0 &&
        session.rol !== 'admin' &&
        existing.rows[0].user_id &&
        existing.rows[0].user_id !== session.id
      ) {
        return NextResponse.json(
          { error: 'Acceso denegado: no puedes modificar la configuración de otro usuario.' },
          { status: 403 }
        );
      }
    }

    await db.query(
      `
      INSERT INTO configuracion_usuario (
        id, user_id, pago_extra_mensual, mes_calendario_inicio, anio_inicio, aportacion_unica_anual, mes_aportacion_unica, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP
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
        configId,
        session.id,
        body.pago_extra_mensual || 0,
        body.mes_calendario_inicio || 1,
        body.anio_inicio || 2026,
        body.aportacion_unica_anual || 0,
        body.mes_aportacion_unica || 12,
      ]
    );

    return NextResponse.json({ success: true, config: { ...body, id: configId, user_id: session.id } });
  } catch (error) {
    console.error('Error updating config in DB:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
