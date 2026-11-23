import { NextResponse } from 'next/server';
import { authenticateUser, generateToken, COOKIE_NAME } from '@/lib/auth';
import { getClientIp, checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

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

    // Limitación de tasa contra ataques de fuerza bruta (5 intentos por 15 minutos)
    const ip = getClientIp(request);
    const cleanUser = String(username).trim().toLowerCase();
    const rateLimitKey = `login:${ip}:${cleanUser}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 900);

    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.resetInSeconds / 60);
      return NextResponse.json(
        {
          success: false,
          error: `Demasiados intentos fallidos. Por seguridad, por favor intenta nuevamente en ${minutes} minuto${minutes > 1 ? 's' : ''}.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetInSeconds),
          },
        }
      );
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario o contraseña incorrectos.',
          intentosRestantes: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    // Inicio de sesión exitoso: reiniciar contador de intentos fallidos
    resetRateLimit(rateLimitKey);

    const days = rememberMe ? 30 : 1;
    const token = generateToken(user, days);

    const response = NextResponse.json({
      success: true,
      user,
      message: 'Inicio de sesión exitoso',
    });

    const proto = request.headers.get('x-forwarded-proto') || '';
    const isHttps = proto === 'https' || request.url.startsWith('https://');

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
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
