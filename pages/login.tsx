import HeroParallax from '@/components/HeroParallax';
import Navigation from '@/components/Navigation';
import WhatItDoesTabs from '@/components/WhatItDoesTabs';
import KPIDashboardPreview from '@/components/KPIDashboardPreview';
import { useEffect, useState } from 'react';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setSuccess(true);
      // Auto-redirect to dashboard after login success
      const t = setTimeout(() => {
        window.location.href = '/kpi';
      }, 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Check if Google OAuth is configured
      const response = await fetch('/api/auth/google/check-config');
      
      if (!response.ok) {
        throw new Error('Configuration check failed');
      }
      
      const config = await response.json();
      
      if (!config.configured) {
        setError('Google login is not configured yet. Please use Guest mode to continue.');
        setIsLoading(false);
        return;
      }
      
      // Open Google OAuth in a popup
      const popup = window.open(
        '/api/auth/google/login',
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes,top=100,left=100'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Listen for the authorization success
      let popupClosed = false;
      const checkClosed = setInterval(() => {
        if (popup?.closed && !popupClosed) {
          popupClosed = true;
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
          // Only show cancelled message if we haven't received a success/error message
          setTimeout(() => {
            if (!popupClosed) return; // Message was received, don't show cancelled
            setError('Authorization cancelled');
          }, 100);
        }
      }, 1000);

      // Handle message from popup
      const handleMessage = async (event: MessageEvent) => {
        console.log('📨 Received message from popup:', event.data);
        if (event.origin !== window.location.origin) {
          console.log('❌ Message from wrong origin:', event.origin);
          return;
        }

        if (event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
          console.log('✅ Login success message received');
          popupClosed = true; // Prevent cancelled message
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          
          // Store user and redirect to dashboard
          localStorage.setItem('user', JSON.stringify(event.data.user));
          console.log('💾 User stored, redirecting to dashboard');
          window.location.href = '/kpi';
        } else if (event.data.type === 'GOOGLE_LOGIN_ERROR') {
          console.log('❌ Login error message received:', event.data.error);
          popupClosed = true; // Prevent cancelled message
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
          setError(`Login failed: ${event.data.error}`);
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (!popup?.closed) {
          popup?.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
          setError('Login timed out. Please try again.');
        }
      }, 300000);

    } catch (err) {
      console.error('Google login error:', err);
      setError('Google login is not available. Please use Guest mode to continue.');
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    // Create a demo user and store in localStorage
    const guestUser = {
      id: 'guest-user',
      name: 'Guest User',
      email: 'guest@example.com',
      loginAt: new Date().toISOString()
    };
    localStorage.setItem('user', JSON.stringify(guestUser));
    window.location.href = '/kpi';
  };

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

        {success && (
          <div style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 8,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            color: '#4ade80'
          }}>
            Login successful. Redirecting to your dashboard...
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <a href="/kpi" style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(34,197,94,0.2)', color: '#4ade80', textDecoration: 'none' }}>Go to Dashboard</a>
              <a href="/calendar" style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(59,130,246,0.2)', color: '#93c5fd', textDecoration: 'none' }}>Open Calendar</a>
            </div>
          </div>
        )}

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

        {!success && (
          <>
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
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{
                width: '100%', height: 48, borderRadius: 8,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Checking…' : 'Continue with Google'}
            </button>
          </>
        )}

        <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}