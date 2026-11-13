import { NextResponse } from 'next/server';
import { authenticateUser, generateToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, rememberMe } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Por favor ingresa usuario y contraseña.' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario o contraseña incorrectos.' },
        { status: 401 }
      );
    }

    const days = rememberMe ? 30 : 1;
    const token = generateToken(user, days);

    const response = NextResponse.json({
      success: true,
      user,
      message: 'Inicio de sesión exitoso',
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: days * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Error en POST /api/auth/login:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor al procesar inicio de sesión.' },
      { status: 500 }
    );
  }
}
