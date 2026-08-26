/**
 * Shared Supabase client accessor.
 *
 * Prefers the client already owned by the auth session (single session/refresh
 * lifecycle — two independent clients cause token-refresh races). Falls back to
 * a standalone client built from NEXT_PUBLIC_* env vars (with legacy VITE_*
 * support) so the database package can run in tests or standalone contexts
 * without the auth package.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { authSession } from '@financeos/auth';

const readEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && typeof process.env === 'object') {
    const val = process.env[key] as string | undefined;
    if (val) return val;
  }
  if (typeof import.meta !== 'undefined') {
    const meta = (import.meta as any).env;
    if (meta && meta[key]) return meta[key] as string;
  }
  return undefined;
};

const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL') || readEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || readEnv('VITE_SUPABASE_ANON_KEY');

let _standaloneClient: SupabaseClient | null | undefined;

function getFallbackClient(): SupabaseClient | null {
  if (_standaloneClient === undefined) {
    if ((globalThis as any).__FINANCEOS_SUPABASE_CLIENT__) {
      _standaloneClient = (globalThis as any).__FINANCEOS_SUPABASE_CLIENT__;
      return _standaloneClient!;
    }

    if (supabaseUrl && supabaseAnonKey && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))) {
      try {
        _standaloneClient = createClient(supabaseUrl, supabaseAnonKey);
        (globalThis as any).__FINANCEOS_SUPABASE_CLIENT__ = _standaloneClient;
      } catch {
        _standaloneClient = null;
      }
    } else {
      _standaloneClient = null;
    }
  }
  return _standaloneClient;
}

/** Standalone client (may be null when env vars are missing). Kept for backward compatibility. */
export const supabase: SupabaseClient | null = null;

/**
 * Returns the session-owned Supabase client when available (avoids
 * token-refresh races between two independent clients), else the standalone
 * client built from env vars.
 */
export function getSupabaseClient(): SupabaseClient | null {
  return authSession.supabase ?? getFallbackClient();
}
