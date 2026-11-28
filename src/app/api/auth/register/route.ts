import { NextResponse } from 'next/server';
import {
  registerNewUser,
  isRegistrationEnabled,
  generateToken,
  COOKIE_NAME,
} from '@/lib/auth';
import { getClientIp, checkRateLimit } from '@/lib/rate-limit';

export async function GET() {
  const registrationEnabled = await isRegistrationEnabled();
  return NextResponse.json(
    { registrationEnabled },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const registrationEnabled = await isRegistrationEnabled();
    if (!registrationEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'El registro de nuevos usuarios está deshabilitado.',
        },
        { status: 403 }
      );
    }

    // Limitación de tasa para creación de cuentas (5 registros por hora por IP)
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`register:${ip}`, 5, 3600);

    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.resetInSeconds / 60);
      return NextResponse.json(
        {
          success: false,
          error: `Límite de registros alcanzado. Por favor intenta de nuevo en ${minutes} minuto${minutes > 1 ? 's' : ''}.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetInSeconds),
          },
        }
      );
    }

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

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      );
    }

    const result = await registerNewUser(nombre, email, password, {
      skipFlagCheck: true,
    });

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

    const proto = request.headers.get('x-forwarded-proto') || '';
    const isHttps = proto === 'https' || request.url.startsWith('https://');

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
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
