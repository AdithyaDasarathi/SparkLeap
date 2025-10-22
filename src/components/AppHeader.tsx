'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function AppHeader({ title = "SparkLeap", subtitle }: AppHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user from Supabase
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error loading user for header:', error);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      // Sign out from Supabase first
      await supabase.auth.signOut();
      
      // Clear all user data
      localStorage.removeItem('user');
      localStorage.removeItem('user-session-id');
      
      // Redirect to Supabase login
      router.push('/login-supabase');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still redirect even if there's an error
      router.push('/login-supabase');
    }
  };

  return (
    <div style={{
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(26, 26, 26, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Left side - Logo and title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/sparkleap.png" alt="SparkLeap" width={24} height={24} />
        <div style={{
          padding: '4px 8px',
          background: '#e5e7eb',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '500',
          color: '#000000'
        }}>Solo</div>
        <h1 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          margin: 0, 
          color: '#ffffff' 
        }}>
          {title}
          {subtitle && <span style={{ color: '#9ca3af' }}> / {subtitle}</span>}
        </h1>
      </div>
      
      {/* Right side - User info and logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* User Info */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {user.picture && (
              <img 
                src={user.picture} 
                alt={user.name}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%'
                }}
              />
            )}
            <span style={{
              fontSize: '12px',
              color: '#ffffff',
              fontWeight: '500'
            }}>{user.name}</span>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <button
          onClick={() => router.push('/kpi-supabase')}
          style={{
            padding: '6px 12px',
            background: 'rgba(59, 130, 246, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 1)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.8)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Dashboard
        </button>

        <button
          onClick={() => router.push('/calendar')}
          style={{
            padding: '6px 12px',
            background: 'rgba(147, 197, 253, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#0b0b0d',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(147, 197, 253, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          Calendar
        </button>

        <button
          onClick={() => router.push('/tasks')}
          style={{
            padding: '6px 12px',
            background: 'rgba(16, 185, 129, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 1)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.8)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Tasks
        </button>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          style={{
            padding: '6px 12px',
            background: 'rgba(239, 68, 68, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 1)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
