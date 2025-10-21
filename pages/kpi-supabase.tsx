import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../src/lib/supabase'
import { User } from '@supabase/supabase-js'
import KPIDashboard from '@/components/KPIDashboard'
import NotionConnect from '@/components/NotionConnect'
import GoogleSheetsConnect from '@/components/GoogleSheetsConnect'
import StripeConnect from '@/components/StripeConnect'
import AppHeader from '@/components/AppHeader'

export default function KPIPage() {
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        setIsLoading(false)
      } catch (error) {
        console.error('Error getting user:', error)
        setIsLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to access the KPI dashboard.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        user={user} 
        onSignOut={handleSignOut}
        onRefresh={handleRefresh}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">KPI Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor your business metrics and track performance over time.
          </p>
        </div>

        {/* Data Source Connections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GoogleSheetsConnect 
            userId={user.id} 
            onConnect={handleRefresh}
          />
          <NotionConnect 
            userId={user.id} 
            onConnect={handleRefresh}
          />
          <StripeConnect 
            userId={user.id} 
            onConnect={handleRefresh}
          />
        </div>

        {/* KPI Dashboard */}
        <KPIDashboard 
          key={refreshKey}
          userId={user.id}
        />
      </main>
    </div>
  )
}
