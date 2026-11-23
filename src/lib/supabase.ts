import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
);

// En el backend, priorizar SUPABASE_SERVICE_ROLE_KEY para omitir RLS de forma segura
// sin requerir políticas públicas permisivas para el rol anónimo.
const activeKey = supabaseServiceRoleKey || supabaseAnonKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, activeKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
