import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import { Usuario } from '@/types';

const SESSION_SECRET = process.env.SESSION_SECRET || 'bola-de-nieve-secure-session-key-2026-financial-freedom';
const COOKIE_NAME = 'bola_session';

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
    .createHmac('sha256', SESSION_SECRET)
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
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expirado
    }

    return payload;
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
  let user: UserRow | null = null;

  // 1. Intentar primero con Supabase si está configurado en producción/nube
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .or(`email.ilike.${cleanInput},id.eq.${cleanInput}`)
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

  // Comprueba bcrypt hash o fallback
  let isValid = false;
  try {
    isValid = await bcrypt.compare(passwordPlain, user.password_hash);
  } catch {
    isValid = false;
  }

  // Fallback si por alguna razón fuera texto plano durante importación
  if (!isValid && user.password_hash === passwordPlain) {
    isValid = true;
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

// Registra un nuevo usuario en la base de datos
export async function registerNewUser(
  nombre: string,
  emailOrUsername: string,
  passwordPlain: string
): Promise<{ user?: Usuario; error?: string }> {
  const cleanEmail = emailOrUsername.trim().toLowerCase();
  const cleanNombre = nombre.trim();
  const id = `u-${Date.now()}`;
  const rol = 'usuario';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // 1. Si Supabase está configurado, registrar en la nube
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: existing } = await supabase
        .from('usuarios')
        .select('id')
        .or(`email.ilike.${cleanEmail},id.eq.${cleanEmail}`)
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
