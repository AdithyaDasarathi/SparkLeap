"use client";

import { useState, useEffect } from 'react';

interface GoogleSheetsAuth {
  accessToken: string;
  refreshToken: string;
  expiryDate?: number;
}

interface SpreadsheetInfo {
  title: string;
  sheets: Array<{
    title: string;
    sheetId: number;
  }>;
}

interface UserInfo {
  email: string;
  name: string;
}

interface GoogleSheetsConnectProps {
  onDataGenerated?: () => void; // Add callback prop
}

export default function GoogleSheetsConnect({ onDataGenerated }: GoogleSheetsConnectProps) {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [range, setRange] = useState('A:Z');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [authInProgress, setAuthInProgress] = useState(false);

  // Check if Google Sheets is already connected and handle OAuth callback
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/datasources?userId=demo-user');
        if (res.ok) {
          const data = await res.json();
          const googleSheetsSource = data.dataSources?.find((ds: any) => ds.source === 'GoogleSheets');
          if (googleSheetsSource) {
            setIsConnected(true);
            setSourceId(googleSheetsSource.id);
            // Try to get spreadsheet info if available
            fetchSpreadsheetInfo(googleSheetsSource.id);
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const auth = urlParams.get('auth');
    const credentials = urlParams.get('credentials');
    const source = urlParams.get('source');
    const error = urlParams.get('error');

    if (auth === 'success' && credentials && source === 'sheets') {
      try {
        const creds = JSON.parse(decodeURIComponent(credentials));
        // Create data source directly with the credentials
        createDataSource(creds);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        setMessage(`Failed to parse credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else if (auth === 'error' || error) {
      setMessage(`Authorization failed: ${error || 'Unknown error'}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      checkConnection();
    }
  }, []);

  const fetchSpreadsheetInfo = async (id: string) => {
    // This would fetch spreadsheet metadata if needed
    // For now, we'll show basic connection status
  };

  const handleGoogleAuth = async () => {
    setAuthInProgress(true);
    setMessage('');

    try {
      // Use the same OAuth endpoint as Calendar but with state parameter
      window.location.href = '/api/google/auth?state=sheets';
    } catch (error) {
      setAuthInProgress(false);
      setMessage(`Authorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAuthCode = async (code: string) => {
    setLoading(true);
    
    try {
      // Step 2: Exchange code for tokens and create data source
      const tokenRes = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          userId: 'demo-user',
          spreadsheetId: spreadsheetId || undefined,
          range: range || 'A:Z'
        })
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        throw new Error(tokenData.error || 'Failed to get access tokens');
      }

      setUserInfo(tokenData.userInfo);
      setSpreadsheetInfo(tokenData.spreadsheetInfo);

      // Create data source with Google Sheets credentials
      await createDataSource(tokenData.tokens);

    } catch (error) {
      setMessage(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setAuthInProgress(false);
    }
  };

  const createDataSource = async (tokens: GoogleSheetsAuth) => {
    setLoading(true);
    setMessage('Connecting to Google Sheets...');
    
    try {
      const credentials = JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiryDate: tokens.expiryDate,
        spreadsheetId,
        range: range || 'A:Z'
      });

      const res = await fetch('/api/datasources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          source: 'GoogleSheets',
          credentials,
          syncFrequency: 'daily'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessage('✅ Google Sheets connected successfully!');
        setIsConnected(true);
        setSourceId(data.dataSource.id);
        setUserInfo({
          email: 'Connected to Google Sheets',
          name: 'Google Sheets User'
        });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create data source');
      }
    } catch (error) {
      setMessage(`Failed to save connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setAuthInProgress(false);
    }
  };

  const handleSync = async () => {
    if (!sourceId) return;

    setLoading(true);
    setMessage('');

    try {
      // Add a longer delay to ensure data source is fully saved and available
      setMessage('⏳ Preparing sync...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage('🔄 Syncing data...');
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId,
          userId: 'demo-user'
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage(`✅ Sync completed! ${data.metricsSynced} metrics processed. Check console for details.`);
      } else {
        setMessage(`❌ Sync failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      setMessage('❌ Sync failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!sourceId || !confirm('Are you sure you want to disconnect Google Sheets?')) return;

    try {
      const res = await fetch(`/api/datasources/${sourceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user' })
      });

      if (res.ok) {
        setIsConnected(false);
        setSourceId(null);
        setSpreadsheetInfo(null);
        setUserInfo(null);
        setMessage('✅ Google Sheets disconnected successfully');
      } else {
        setMessage('❌ Failed to disconnect Google Sheets');
      }
    } catch (error) {
      setMessage('❌ Failed to disconnect Google Sheets');
    }
  };

  const handleVerifySync = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/kpi/verify-sync?userId=demo-user&source=GoogleSheets&hours=24');
      const data = await res.json();
      
      if (data.success) {
        const { verification } = data;
        console.log('🔍 Sync verification:', verification);
        
        if (verification.latestSyncedMetrics.length > 0) {
          const metricsList = verification.latestSyncedMetrics
            .map((m: any) => `${m.metricName}: ${m.value}`)
            .join(', ');
          
          setMessage(`✅ Sync verified! Found ${verification.latestSyncedMetrics.length} metrics: ${metricsList}`);
        } else {
          setMessage('⚠️ No recent synced metrics found. Try syncing again.');
        }
      } else {
        setMessage(`❌ Verification failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setMessage('❌ Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHistoricalData = async () => {
    setLoading(true);
    setMessage('');

    try {
      console.log('🔄 Generating historical data...');
      const res = await fetch('/api/kpi/generate-historical-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: 'demo-user', 
          days: 30, 
          source: 'GoogleSheets' 
        })
      });
      
      const data = await res.json();
      console.log('📊 Historical data generation response:', data);
      
      if (data.success) {
        setMessage(`✅ Generated ${data.totalDataPoints} historical data points for ${data.totalMetrics} metrics! The KPI graphs will now show trends.`);
        
        // Call the callback to refresh the dashboard
        if (onDataGenerated) {
          console.log('🔄 Calling onDataGenerated callback to refresh dashboard...');
          onDataGenerated();
        }
      } else {
        setMessage(`❌ Failed to generate historical data: ${data.error}`);
      }
    } catch (error) {
      console.error('Historical data generation error:', error);
      setMessage('❌ Failed to generate historical data. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleSpreadsheetUrlChange = (value: string) => {
    const extractedId = extractSpreadsheetId(value);
    setSpreadsheetId(extractedId);
  };

  return (
    <div style={{
      background: 'transparent',
      borderRadius: '16px',
      padding: '0',
      marginBottom: '0'
    }}>
      <div style={{
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #ffffff, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Google Sheets Integration</h2>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0
        }}>Connect your Google Sheets to automatically sync KPI data</p>
      </div>

      {!isConnected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="spreadsheetId" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              Google Sheets URL or ID
            </label>
            <input
              id="spreadsheetId"
              type="text"
              value={spreadsheetId}
              onChange={(e) => handleSpreadsheetUrlChange(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit or just the ID"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
            <p style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '4px',
              margin: 0
            }}>
              Paste your Google Sheets URL or just the spreadsheet ID
            </p>
          </div>

          <div>
            <label htmlFor="range" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              Data Range (optional)
            </label>
            <input
              id="range"
              type="text"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder="A:Z (default)"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
            <p style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '4px',
              margin: 0
            }}>
              Specify the range to read data from (e.g., A1:D100, Sheet1!A:D)
            </p>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading || authInProgress}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading || authInProgress ? 'not-allowed' : 'pointer',
              opacity: loading || authInProgress ? 0.6 : 1,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading && !authInProgress) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !authInProgress) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }
            }}
          >
            {authInProgress ? 'Authorizing...' : loading ? 'Connecting...' : 'Connect Google Sheets'}
          </button>

          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h4 style={{
              fontWeight: '600',
              color: '#fbbf24',
              marginBottom: '12px',
              fontSize: '14px'
            }}>Setup Instructions:</h4>
            <ol style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0,
              paddingLeft: '16px'
            }}>
              <li style={{ marginBottom: '4px' }}>Make sure your Google Sheet is shared with "Anyone with the link can view"</li>
              <li style={{ marginBottom: '4px' }}>Your sheet should have column headers that match KPI names (MRR, Net Profit, etc.)</li>
              <li style={{ marginBottom: '4px' }}>Data should be in rows below the headers</li>
              <li>Click "Connect Google Sheets" to authorize access</li>
            </ol>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h3 style={{
              fontWeight: '600',
              color: '#4ade80',
              marginBottom: '12px',
              fontSize: '16px'
            }}>✅ Connected to Google Sheets</h3>
            {userInfo && (
              <p style={{
                fontSize: '14px',
                color: '#6ee7b7',
                marginBottom: '4px'
              }}>Account: {userInfo.email}</p>
            )}
            {spreadsheetInfo && (
              <p style={{
                fontSize: '14px',
                color: '#6ee7b7',
                marginBottom: '8px'
              }}>Spreadsheet: {spreadsheetInfo.title}</p>
            )}
            <p style={{
              fontSize: '13px',
              color: '#6ee7b7',
              margin: 0
            }}>
              💡 <strong>Tip:</strong> After syncing data, click "Generate Trends" to create historical data points for beautiful KPI graphs!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleSync}
              disabled={loading}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }
              }}
            >
              {loading ? 'Syncing...' : 'Sync Data'}
            </button>
            <button
              onClick={handleVerifySync}
              disabled={loading}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
            >
              Verify Sync
            </button>
            <button
              onClick={handleGenerateHistoricalData}
              disabled={loading}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f97316, #dc2626)',
                color: '#000000',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              Generate Trends
            </button>
            <button
              onClick={handleDisconnect}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          background: message.includes('✅') 
            ? 'rgba(34, 197, 94, 0.1)'
            : 'rgba(239, 68, 68, 0.1)',
          color: message.includes('✅') 
            ? '#4ade80'
            : '#fca5a5',
          border: message.includes('✅') 
            ? '1px solid rgba(34, 197, 94, 0.2)'
            : '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          {message}
        </div>
      )}

      {/* OAuth callback handler */}
      <script dangerouslySetInnerHTML={{
        __html: `
          if (window.location.search.includes('code=')) {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');
            
            if (code) {
              window.opener?.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', code }, window.location.origin);
            } else if (error) {
              window.opener?.postMessage({ type: 'GOOGLE_OAUTH_ERROR', error }, window.location.origin);
            }
            window.close();
          }
        `
      }} />
    </div>
  );
}