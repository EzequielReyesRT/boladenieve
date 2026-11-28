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

    // Limitación de tasa contra ataques de fuerza bruta (por IP+usuario y por cuenta)
    const ip = getClientIp(request);
    const cleanUser = String(username).trim().toLowerCase();
    const rateLimitKey = `login:${ip}:${cleanUser}`;
    const accountRateLimitKey = `login:account:${cleanUser}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 900);
    const accountRateLimit = checkRateLimit(accountRateLimitKey, 10, 900);

    if (!rateLimit.allowed || !accountRateLimit.allowed) {
      const resetInSeconds = Math.max(rateLimit.resetInSeconds, accountRateLimit.resetInSeconds);
      const minutes = Math.ceil(resetInSeconds / 60);
      return NextResponse.json(
        {
          success: false,
          error: `Demasiados intentos fallidos. Por seguridad, por favor intenta nuevamente en ${minutes} minuto${minutes > 1 ? 's' : ''}.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(resetInSeconds),
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
          intentosRestantes: Math.min(rateLimit.remaining, accountRateLimit.remaining),
        },
        { status: 401 }
      );
    }

    // Inicio de sesión exitoso: reiniciar contadores de intentos fallidos
    resetRateLimit(rateLimitKey);
    resetRateLimit(accountRateLimitKey);

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
