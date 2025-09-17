'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function GoogleOAuthCallback() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processAuth = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        if (code) {
          // Send the authorization code to the parent window
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', code }, window.location.origin);
          } else {
            // If no opener, redirect back to calendar with success
            window.location.href = '/calendar?auth=success';
          }
        } else if (error) {
          // Send the error to the parent window
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_OAUTH_ERROR', error }, window.location.origin);
          } else {
            // If no opener, redirect back to calendar with error
            window.location.href = `/calendar?auth=error&message=${encodeURIComponent(error)}`;
          }
        } else {
          // No code or error, redirect to calendar
          window.location.href = '/calendar';
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
  }, [searchParams]);

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