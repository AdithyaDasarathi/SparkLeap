import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug logging
console.log('🔍 Supabase Config:', {
  url: supabaseUrl,
  anonKey: supabaseAnonKey ? 'Present' : 'Missing',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations only
export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin can only be used on the server side')
  }

  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    }
  )
}
