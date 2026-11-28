import { createClient } from '@supabase/supabase-js';

// NOTE: SUPABASE_SERVICE_ROLE_KEY is only used on the server side.
// Ensure this module is imported only in server‑only code to avoid leaking the key to the client.


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
);

// En el backend, priorizar SUPABASE_SERVICE_ROLE_KEY para omitir RLS de forma segura
// sin requerir políticas públicas permisivas para el rol anónimo.
let activeKey: string | undefined;
if (typeof window === 'undefined') {
  // Server‑side: prefer the service‑role key (never sent to the client)
  activeKey = supabaseServiceRoleKey || supabaseAnonKey;
} else {
  // Client‑side: only expose the anon/public key
  activeKey = supabaseAnonKey;
}


export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, activeKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
