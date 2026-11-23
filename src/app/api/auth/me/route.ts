import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserRow } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      const response = NextResponse.json(
        { authenticated: false, user: null },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    let user = {
      id: payload.id,
      nombre: payload.nombre,
      email: payload.email,
      rol: payload.rol,
      created_at: new Date().toISOString(),
    };

    let userFound = false;
    let queryExecutedSuccessfully = false;

    // 1. Si Supabase está configurado en la nube, consultar allí primero
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nombre, email, rol, created_at')
          .eq('id', payload.id)
          .maybeSingle();

        if (!error) {
          queryExecutedSuccessfully = true;
          if (data) {
            userFound = true;
            user = {
              id: data.id,
              nombre: data.nombre,
              email: data.email,
              rol: data.rol,
              created_at: data.created_at || user.created_at,
            };
          }
        }
      } catch (err) {
        console.warn('Advertencia al consultar usuario en Supabase:', err);
      }
    }

    // 2. Si no se encontró en Supabase (o no está configurado), consultar base local (PGlite)
    if (!userFound) {
      try {
        const db = getDb();
        const res = await db.query<UserRow>(
          'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = $1 LIMIT 1',
          [payload.id]
        );
        queryExecutedSuccessfully = true;

        if (res.rows.length > 0) {
          userFound = true;
          user = {
            id: res.rows[0].id,
            nombre: res.rows[0].nombre,
            email: res.rows[0].email,
            rol: res.rows[0].rol,
            created_at: res.rows[0].created_at,
          };
        }
      } catch {
        // Error de conexión o bloqueo en base de datos local
      }
    }

    // 3. Manejo de revocación vs fallo transitorio:
    // Si la base de datos se consultó exitosamente y confirmó que el usuario ya NO existe:
    // Revocar la sesión inmediatamente eliminando la cookie.
    if (queryExecutedSuccessfully && !userFound) {
      const response = NextResponse.json(
        { authenticated: false, user: null },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // Si hubo un fallo transitorio de conexión a la BD, pero el token criptográfico HMAC-SHA256 es válido,
    // se mantiene la sesión activa con los datos del payload firmado para evitar desconectar al usuario.
    return NextResponse.json(
      { authenticated: true, user },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    if ((error as unknown as { digest?: string })?.digest === 'HANGING_PROMISE_REJECTION') {
      throw error;
    }
    return NextResponse.json(
      { authenticated: false, user: null },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }
}
