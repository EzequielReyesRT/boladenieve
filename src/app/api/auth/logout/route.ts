import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Sesión cerrada correctamente' });
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (error) {
    console.error('Error en POST /api/auth/logout:', error);
    return NextResponse.json({ success: false, error: 'Error al cerrar sesión' }, { status: 500 });
  }
}
