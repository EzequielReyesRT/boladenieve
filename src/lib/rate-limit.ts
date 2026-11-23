interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Almacenamiento en memoria para limitación de tasa
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Obtiene la dirección IP del cliente a partir de los encabezados HTTP
 */
export function getClientIp(request: Request): string {
  // 1. Cloudflare header prioritario (no manipulable por el cliente si el tráfico pasa por CF)
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  // 2. Real IP de proxies intermedios configurados
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // 3. X-Forwarded-For (tomar la última IP confiable si hay cadena o la primera)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) return ips[0];
  }

  return '127.0.0.1';
}

/**
 * Comprueba si una clave ha superado el límite de peticiones permitido en una ventana de tiempo
 * @param key Identificador único (ej. `login:192.168.1.1` o `login:username`)
 * @param maxAttempts Número máximo de intentos permitidos en la ventana
 * @param windowSeconds Duración de la ventana en segundos
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900 // 15 minutos por defecto
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  // Si no existe o la ventana expiró, iniciar nuevo contador
  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowSeconds * 1000;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetInSeconds: windowSeconds,
    };
  }

  // Si aún está dentro de la ventana de tiempo
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - existing.count,
    resetInSeconds,
  };
}

/**
 * Reinicia el contador de intentos para una clave dada (ej. tras un inicio de sesión exitoso)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// Limpieza periódica de registros obsoletos cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 10 * 60 * 1000).unref?.();
}
