import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Allowed origins for CORS – same-origin is always allowed, plus any configured ALLOWED_ORIGINS
const envOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export function middleware(request: NextRequest) {
  // Apply only to API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const origin = request.headers.get('origin') ?? '';
  const isDev = process.env.NODE_ENV !== 'production';
  const isAllowed =
    Boolean(origin) &&
    (origin === request.nextUrl.origin ||
      envOrigins.includes(origin) ||
      (isDev && envOrigins.length === 0 && origin === 'http://localhost:3000'));

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    const headers = new Headers();
    headers.set('Vary', 'Origin');
    if (isAllowed) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');
    }
    headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Max-Age', '86400'); // 24h
    return new NextResponse(null, { status: 204, headers });
  }

  // For actual requests, add CORS headers to the response
  const response = NextResponse.next();
  response.headers.set('Vary', 'Origin');
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
