import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { UserRow } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Confirmar que el usuario aún exista en la BD
    const db = getDb();
    const res = await db.query<UserRow>(
      'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = $1 LIMIT 1',
      [payload.id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = {
      id: res.rows[0].id,
      nombre: res.rows[0].nombre,
      email: res.rows[0].email,
      rol: res.rows[0].rol,
      created_at: res.rows[0].created_at,
    };

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    if ((error as unknown as { digest?: string })?.digest === 'HANGING_PROMISE_REJECTION') {
      throw error;
    }
    return NextResponse.json({ authenticated: false, user: null });
  }
}
