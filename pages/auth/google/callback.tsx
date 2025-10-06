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
        
        if (code) {
          // Exchange code for user info and create session
          const response = await fetch('/api/auth/google/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Store user info in localStorage for demo (in production, use secure sessions)
            localStorage.setItem('user', JSON.stringify(result.user));
            
            // Check if this was for Google Sheets integration (from state parameter)
            const isSheets = state && state.startsWith('sheets_');
            
            // Send success to parent window or redirect
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_LOGIN_SUCCESS', user: result.user }, window.location.origin);
            } else {
              if (isSheets) {
                // Redirect to KPI dashboard with success message for sheets
                window.location.href = '/kpi?auth=success&source=sheets';
              } else {
                // Regular login - redirect to login success page
                window.location.href = '/login?success=true';
              }
            }
          } else {
            throw new Error(result.error || 'Authentication failed');
          }
        } else if (error) {
          // Send the error to the parent window
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_LOGIN_ERROR', error }, window.location.origin);
          } else {
            // If no opener, redirect back to login with error
            window.location.href = `/login?error=${encodeURIComponent(error)}`;
          }
        } else {
          // No code or error, redirect to login
          window.location.href = '/login';
        }
        
        // Close the popup window after a short delay
        setTimeout(() => {
          if (window.opener) {
            window.close();
          }
        }, 1000);
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