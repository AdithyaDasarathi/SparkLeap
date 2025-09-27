import React, { useState, useEffect } from 'react';

interface StripeConnectProps {
  onDataGenerated?: () => void;
}

export default function StripeConnect({ onDataGenerated }: StripeConnectProps) {
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  // Check if Stripe is already connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/datasources?userId=demo-user');
        if (res.ok) {
          const data = await res.json();
          const stripeSource = data.dataSources?.find((ds: any) => ds.source === 'Stripe');
          if (stripeSource) {
            setIsConnected(true);
            setSourceId(stripeSource.id);
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };
    checkConnection();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setMessage('');
    
    if (!apiKey) {
      setMessage('Please enter your Stripe API key');
      setLoading(false);
      return;
    }

    try {
      // Test the API key
      const authRes = await fetch('/api/stripe/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          userId: 'demo-user'
        })
      });

      if (!authRes.ok) {
        const errorData = await authRes.json();
        throw new Error(errorData.error || 'Failed to authenticate');
      }

      const authData = await authRes.json();
      setAccountInfo(authData.account);

      // Create data source
      const res = await fetch('/api/datasources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          source: 'Stripe',
          credentials: apiKey,
          syncFrequency: 'daily'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessage('Stripe connected successfully!');
        setIsConnected(true);
        setSourceId(data.dataSource.id);
        
        if (onDataGenerated) {
          onDataGenerated();
        }
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to connect');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      setMessage(`Failed to connect: ${error.message}`);
    }
    setLoading(false);
  };

  const handleSync = async () => {
    if (!sourceId) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/stripe/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId,
          userId: 'demo-user'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(`Sync completed! ${data.metricsSynced} metrics synced.`);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Sync failed');
      }
    } catch (error: any) {
      setMessage(`Sync failed: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: 'transparent',
      borderRadius: '16px',
      padding: '0',
      marginBottom: '0'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #ffffff, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Stripe Integration</h2>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0
        }}>Connect your Stripe account to automatically sync payment and subscription data</p>
      </div>

      {!isConnected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="apiKey" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              Stripe Secret API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_test_..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '4px',
              margin: 0
            }}>
              Find your API key in your Stripe Dashboard under Developers → API keys
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={loading || !apiKey}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? 'rgba(255, 255, 255, 0.3)' : 'linear-gradient(135deg,  #3b82f6, #2563eb)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Connecting...' : 'Connect Stripe'}
          </button>

          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: message.includes('success') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${message.includes('success') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: message.includes('success') ? '#22c55e' : '#ef4444',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22c55e'
              }}></div>
              <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600' }}>
                Stripe Connected
              </span>
            </div>
            {accountInfo && (
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
                Account: {accountInfo.email} ({accountInfo.country?.toUpperCase()})
              </div>
            )}
          </div>

          <button
            onClick={handleSync}
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? 'rgba(255, 255, 255, 0.3)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Syncing...' : 'Sync Data'}
          </button>

          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#3b82f6',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
