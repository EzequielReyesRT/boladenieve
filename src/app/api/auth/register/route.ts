import { NextResponse } from 'next/server';
import { registerNewUser, generateToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, email, password } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { success: false, error: 'Por favor ingresa tu nombre.' },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Por favor ingresa un correo o usuario válido.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const result = await registerNewUser(nombre, email, password);

    if (result.error || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || 'Error al registrar el usuario.' },
        { status: 409 }
      );
    }

    // Iniciar sesión automáticamente expidiendo la cookie
    const token = generateToken(result.user, 30);
    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Cuenta creada con éxito',
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Error en POST /api/auth/register:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor al procesar registro.' },
      { status: 500 }
    );
  }
}
