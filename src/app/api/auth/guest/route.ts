import { NextResponse } from 'next/server';
import { authenticateUser, generateToken, COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const guestUsername = process.env.GUEST_USERNAME?.trim();
    const guestPassword = process.env.GUEST_PASSWORD;

    if (!guestUsername || !guestPassword) {
      return NextResponse.json(
        { success: false, error: 'El acceso de invitado no está habilitado.' },
        { status: 503 }
      );
    }

    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`guest:${ip}`, 10, 900);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Intenta nuevamente más tarde.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.resetInSeconds) },
        }
      );
    }

    const user = await authenticateUser(guestUsername, guestPassword);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No se pudo iniciar sesión como invitado.' },
        { status: 401 }
      );
    }

    const token = generateToken(user, 1);
    const response = NextResponse.json({
      success: true,
      user,
      message: 'Sesión de invitado iniciada',
    });

    const proto = request.headers.get('x-forwarded-proto') || '';
    const isHttps = proto === 'https' || request.url.startsWith('https://');

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
