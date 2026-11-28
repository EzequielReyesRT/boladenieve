import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getDb } from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import { Usuario } from '@/types';

const COOKIE_NAME = 'bola_session';

// Obtiene la clave de firma de sesión de forma segura y criptográficamente robusta
declare global {
  var __bola_session_secret__: string | undefined;
}

export function getSessionSecret(): string {
  if (globalThis.__bola_session_secret__) return globalThis.__bola_session_secret__;

  const envSecret = process.env.SESSION_SECRET?.trim();

  if (envSecret && envSecret.length >= 32) {
    globalThis.__bola_session_secret__ = envSecret;
    return globalThis.__bola_session_secret__;
  }

  // En producción, advertir si falta SESSION_SECRET y generar una clave efímera de alta entropía
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '⚠️ [SEGURIDAD CRÍTICA] SESSION_SECRET no configurada (mínimo 32 caracteres). ' +
      'Se ha generado una clave efímera para esta instancia.'
    );
  }

  globalThis.__bola_session_secret__ = crypto.randomBytes(64).toString('hex');
  return globalThis.__bola_session_secret__;
}

export interface UserRow {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: string;
  created_at: string;
  updated_at: string;
}

export interface SessionPayload {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  exp: number;
}

// Genera un token HMAC-SHA256 firmado con expiración
export function generateToken(user: Usuario, days = 30): string {
  const exp = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
  const payload: SessionPayload = {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    exp,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

// Verifica y decodifica el token firmado
export function verifyToken(token: string): SessionPayload | null {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', getSessionSecret())
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (
      sigBuf.length !== expBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expBuf)
    ) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null; // Expirado o sin expiración válida
    }

    return payload;
  } catch {
    return null;
  }
}

// Obtiene el usuario de la sesión activa leyendo las cookies de la petición
export async function getSessionUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// Verifica credenciales contra la base de datos (Supabase en la nube o Local)
export async function authenticateUser(
  usernameOrEmail: string,
  passwordPlain: string
): Promise<Usuario | null> {
  const cleanInput = usernameOrEmail.trim().toLowerCase();

  // Validación estricta contra PostgREST Filter Injection y caracteres de control
  if (!cleanInput || !/^[a-zA-Z0-9_.@+-]{1,120}$/.test(cleanInput)) {
    return null;
  }

  let user: UserRow | null = null;

  // 1. Intentar primero con Supabase si está configurado en producción/nube
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .or(`email.eq.${cleanInput},id.eq.${cleanInput}`)
        .maybeSingle();

      if (data && !error) {
        user = data as UserRow;
      }
    } catch (e) {
      console.warn('Advertencia al consultar usuario en Supabase:', e);
    }
  }

  // 2. Si no se encontró en Supabase o estamos en local, consultar DB local (PGlite)
  if (!user) {
    try {
      const db = getDb();
      const res = await db.query<UserRow>(
        `SELECT * FROM usuarios WHERE LOWER(email) = $1 OR id = $1 LIMIT 1`,
        [cleanInput]
      );
      if (res.rows.length > 0) {
        user = res.rows[0];
      }
    } catch {
      // Base local no disponible o entorno serverless read-only
    }
  }

  if (!user) {
    return null;
  }

  // Solo se acepta comparación contra hash criptográfico seguro (bcrypt)
  let isValid = false;
  try {
    if (
      user.password_hash &&
      typeof user.password_hash === 'string' &&
      user.password_hash.startsWith('$2')
    ) {
      isValid = await bcrypt.compare(passwordPlain, user.password_hash);
    }
  } catch {
    isValid = false;
  }

  if (!isValid) return null;

  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    created_at: user.created_at,
  };
}

const REGISTRATION_FLAG_KEY = 'registro_habilitado';

/**
 * Consulta en la base de datos si el registro de nuevos usuarios está habilitado.
 * Por defecto devuelve `true` si la bandera aún no existe.
 */
export async function isRegistrationEnabled(): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('valor_booleano')
        .eq('clave', REGISTRATION_FLAG_KEY)
        .maybeSingle();

      if (!error && data && typeof data.valor_booleano === 'boolean') {
        return data.valor_booleano;
      }
    } catch (e) {
      console.warn('Advertencia al consultar bandera de registro en Supabase:', e);
    }
    return true;
  }

  try {
    const db = getDb();
    const res = await db.query<{ valor_booleano: boolean }>(
      `SELECT valor_booleano FROM configuracion_sistema WHERE clave = $1 LIMIT 1`,
      [REGISTRATION_FLAG_KEY]
    );
    if (res.rows.length > 0 && typeof res.rows[0].valor_booleano === 'boolean') {
      return res.rows[0].valor_booleano;
    }
  } catch {
    // Si la tabla aún no existe en local, permitir por compatibilidad
  }

  return true;
}

// Registra un nuevo usuario en la base de datos
export async function registerNewUser(
  nombre: string,
  emailOrUsername: string,
  passwordPlain: string,
  options?: { skipFlagCheck?: boolean }
): Promise<{ user?: Usuario; error?: string }> {
  if (!options?.skipFlagCheck) {
    const registrationEnabled = await isRegistrationEnabled();
    if (!registrationEnabled) {
      return { error: 'El registro de nuevos usuarios está deshabilitado.' };
    }
  }

  const cleanEmail = emailOrUsername.trim().toLowerCase();
  const cleanNombre = nombre.trim();

  // Validación estricta contra inyección y caracteres no permitidos en identificador/correo
  if (!cleanEmail || !/^[a-zA-Z0-9_.@+-]{3,120}$/.test(cleanEmail)) {
    return { error: 'El correo o nombre de usuario contiene caracteres no válidos o longitud incorrecta.' };
  }

  if (!cleanNombre || cleanNombre.length < 2 || cleanNombre.length > 100) {
    return { error: 'El nombre debe tener entre 2 y 100 caracteres.' };
  }

  if (!passwordPlain || passwordPlain.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const id = `u-${Date.now()}`;
  const rol = 'usuario';
  const passwordHash = await bcrypt.hash(passwordPlain, 12);

  // 1. Si Supabase está configurado, registrar en la nube
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: existing } = await supabase
        .from('usuarios')
        .select('id')
        .or(`email.eq.${cleanEmail},id.eq.${cleanEmail}`)
        .maybeSingle();

      if (existing) {
        return { error: 'Ya existe una cuenta registrada con este correo o usuario.' };
      }

      const { error: insertError } = await supabase.from('usuarios').insert({
        id,
        nombre: cleanNombre,
        email: cleanEmail,
        password_hash: passwordHash,
        rol,
      });

      if (insertError) {
        console.error('Error al insertar usuario en Supabase:', insertError);
        return { error: 'Error al registrar el usuario en Supabase.' };
      }

      return {
        user: {
          id,
          nombre: cleanNombre,
          email: cleanEmail,
          rol,
          created_at: new Date().toISOString(),
        },
      };
    } catch (e) {
      console.error('Error en conexión con Supabase:', e);
      return { error: 'No se pudo conectar a la base de datos de usuarios en la nube.' };
    }
  }

  // 2. Modo Local (PGlite)
  try {
    const db = getDb();
    const existing = await db.query<UserRow>(
      `SELECT id FROM usuarios WHERE LOWER(email) = $1 LIMIT 1`,
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return { error: 'Ya existe una cuenta registrada con este correo o usuario.' };
    }

    await db.query(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4, $5)`,
      [id, cleanNombre, cleanEmail, passwordHash, rol]
    );

    return {
      user: {
        id,
        nombre: cleanNombre,
        email: cleanEmail,
        rol,
        created_at: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error('Error en registro local:', err);
    return { error: 'Error interno al registrar usuario localmente.' };
  }
}

export { COOKIE_NAME };
