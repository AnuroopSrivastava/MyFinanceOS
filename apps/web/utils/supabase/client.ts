import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authSession } from '@financeos/auth'

let client: SupabaseClient | undefined

export function createClient(): SupabaseClient | null {
  if (client) return client

  if ((globalThis as any).__FINANCEOS_SUPABASE_CLIENT__) {
    client = (globalThis as any).__FINANCEOS_SUPABASE_CLIENT__
    authSession.setClient(client!)
    return client!
  }

  // If authSession already has an initialized client, reuse it
  const authClient = (authSession as any)._supabase
  if (authClient) {
    client = authClient
    ;(globalThis as any).__FINANCEOS_SUPABASE_CLIENT__ = client
    return client!
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return null
  }

  try {
    client = createBrowserClient(url, key)
    ;(globalThis as any).__FINANCEOS_SUPABASE_CLIENT__ = client
    authSession.setClient(client)
    return client
  } catch {
    return null
  }
}


