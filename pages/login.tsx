import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setSuccess(true);
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
      
      // Redirect to Google OAuth
      window.location.href = '/api/auth/google/login';
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
      email: 'guest@sparkleap.com',
      name: 'Guest User',
      picture: null,
      loginAt: new Date().toISOString(),
      isGuest: true
    };
    
    localStorage.setItem('user', JSON.stringify(guestUser));
    
    // Redirect to dashboard
    window.location.href = '/kpi';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #0c0c0e, #1a1a1f)',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Login Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: '48px',
        width: '100%',
        maxWidth: '440px',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#ffffff',
            margin: 0
          }}>SparkLeap</h1>
        </div>

        {/* Welcome Text */}
        <div style={{ marginBottom: '32px' }}>
          {success ? (
            <>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#10b981',
                margin: '0 0 8px 0',
                lineHeight: '1.2'
              }}>Login Successful!</h2>
              <p style={{
                fontSize: '16px',
                color: '#9ca3af',
                margin: '0 0 24px 0',
                lineHeight: '1.5'
              }}>
                You have been logged in successfully. Click below to access your dashboard.
              </p>
              <button
                onClick={() => window.location.href = '/kpi'}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Go to Dashboard
              </button>
            </>
          ) : (
            <>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#ffffff',
                margin: '0 0 8px 0',
                lineHeight: '1.2'
              }}>Welcome back</h2>
              <p style={{
                fontSize: '16px',
                color: '#9ca3af',
                margin: 0,
                lineHeight: '1.5'
              }}>
                Sign in to access your business intelligence dashboard
              </p>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && !success && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            color: '#fca5a5',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Continue as Guest Button - Primary Option */}
        {!success && (
          <>
            <button
              onClick={handleGuestLogin}
              style={{
                width: '100%',
                height: '48px',
                background: 'linear-gradient(135deg, #f97316, #dc2626)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)',
                marginBottom: '16px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(249, 115, 22, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(249, 115, 22, 0.35)';
              }}
            >
              {/* Guest Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Continue as Guest
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '16px 0',
              gap: '16px'
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                background: 'rgba(255, 255, 255, 0.1)'
              }} />
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500'
              }}>or</span>
              <div style={{
                flex: 1,
                height: '1px',
                background: 'rgba(255, 255, 255, 0.1)'
              }} />
            </div>

            {/* Google Login Button - Secondary Option */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{
                width: '100%',
                height: '48px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                marginBottom: '24px',
                opacity: isLoading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {isLoading ? (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #e5e7eb',
                  borderTop: '2px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <>
                  {/* Google Icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </>
        )}

        {/* Terms */}
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          lineHeight: '1.5',
          margin: 0
        }}>
          By continuing, you agree to our{' '}
          <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Privacy Policy
          </a>
        </p>
      </div>

      {/* Spinning animation for loading state */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}