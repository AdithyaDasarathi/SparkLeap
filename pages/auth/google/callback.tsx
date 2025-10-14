import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function GoogleOAuthCallback() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processAuth = async () => {
      try {
        const code = router.query.code as string;
        const error = router.query.error as string;
        const state = router.query.state as string;
        
        console.log('🔍 OAuth callback received:', { code: !!code, error, state, hasOpener: !!window.opener });
        
        if (code) {
          console.log('🔄 Exchanging code for user info...');
          // Exchange code for user info and create session
          const response = await fetch('/api/auth/google/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          
          console.log('📡 Exchange response status:', response.status);
          console.log('📡 Exchange response ok:', response.ok);
          
          const result = await response.json();
          console.log('📡 Exchange result:', result);
          
          if (result.success) {
            // Store user info in localStorage for demo (in production, use secure sessions)
            localStorage.setItem('user', JSON.stringify(result.user));
            console.log('💾 User stored in localStorage:', result.user);
            
            // Also store in sessionStorage as backup
            sessionStorage.setItem('user', JSON.stringify(result.user));
            console.log('💾 User also stored in sessionStorage');
            
            // Verify storage worked
            const storedUser = localStorage.getItem('user');
            const sessionUser = sessionStorage.getItem('user');
            console.log('🔍 Verification - localStorage user:', storedUser ? 'Found' : 'Not found');
            console.log('🔍 Verification - sessionStorage user:', sessionUser ? 'Found' : 'Not found');
            
            // Check if this was for Google Sheets integration (from state parameter)
            const isSheets = state && state.startsWith('sheets_');
            
            console.log('✅ Login successful, redirecting to dashboard:', { isSheets });
            
            // Redirect immediately with user data in URL as backup
            const userParam = encodeURIComponent(JSON.stringify(result.user));
            if (isSheets) {
              // Redirect to KPI dashboard with success message for sheets
              window.location.href = `/kpi?auth=success&source=sheets&user=${userParam}`;
            } else {
              // Regular login - redirect directly to dashboard
              window.location.href = `/kpi?auth=success&user=${userParam}`;
            }
          } else {
            console.error('❌ Exchange failed:', result);
            throw new Error(result.error || 'Authentication failed');
          }
        } else if (error) {
          // Redirect back to login with error
          window.location.href = `/login?error=${encodeURIComponent(error)}`;
        } else {
          // No code or error, redirect to login
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setIsProcessing(false);
      }
    };

    processAuth();
  }, [router.query]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0e, #1a1a1f)',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid #ffffff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          Processing Google Authorization...
        </div>
        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
          Please wait while we complete the authentication
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}