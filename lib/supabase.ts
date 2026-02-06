import { createClient } from '@supabase/supabase-js'

// Supabase Client für Client-Side (Browser)
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL oder Key fehlt. Verwende localStorage als Fallback.')
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (input, init = {}) => fetch(input, { ...init, cache: 'no-store' }),
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

// Supabase Client für Server-Side (mit Service Role Key)
export const createSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      fetch: (input, init = {}) => fetch(input, { ...init, cache: 'no-store' }),
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}













