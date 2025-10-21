import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../src/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function LoginSupabase() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        router.push('/kpi-supabase')
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user)
          router.push('/kpi-supabase')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Error signing in:', error)
        setError('Google sign-in failed. Please try again.')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An error occurred during sign-in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = () => {
    // Create a demo user and store in localStorage
    const guestUser = {
      id: 'guest-user',
      name: 'Guest User',
      email: 'guest@example.com',
      loginAt: new Date().toISOString()
    }
    localStorage.setItem('user', JSON.stringify(guestUser))
    router.push('/kpi-supabase')
  }

  if (user) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0c0c0e, #1a1a1f)',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Redirecting...</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Please wait</div>
        </div>
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0c0c0e, #1a1a1f)',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: '24px',
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        backdropFilter: 'blur(16px)'
      }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>SparkLeap</h1>
        <p style={{ marginTop: 8, color: 'rgba(255,255,255,0.7)' }}>Welcome back</p>

        {error && (
          <div style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 8,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGuestLogin}
          style={{
            width: '100%', height: 48, borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #f97316, #dc2626)', color: '#fff',
            fontWeight: 600, cursor: 'pointer', marginTop: 16
          }}
        >
          Continue as Guest
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            width: '100%', height: 48, borderRadius: 8,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  )
}