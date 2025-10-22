import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/login-supabase?error=auth_failed')
          return
        }

        if (data.session) {
          // Create or update user profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.session.user.id,
              email: data.session.user.email,
              name: data.session.user.user_metadata?.full_name,
              picture: data.session.user.user_metadata?.avatar_url,
              updated_at: new Date().toISOString()
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
          }

          // Check if this is a Google Sheets authentication
          const urlParams = new URLSearchParams(window.location.search)
          const intent = urlParams.get('intent')
          
          if (intent === 'sheets') {
            // Redirect back to KPI page with sheets intent
            router.push('/kpi-supabase?intent=sheets')
          } else {
            router.push('/kpi-supabase')
          }
        } else {
          router.push('/login-supabase')
        }
      } catch (error) {
        console.error('Callback error:', error)
        router.push('/login-supabase?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return <div>Authenticating...</div>
}
