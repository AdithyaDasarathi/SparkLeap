"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

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
  const [csvData, setCsvData] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [authInProgress, setAuthInProgress] = useState(false);

  // Get current user from Supabase
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user from Supabase
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error loading user for Google Sheets:', error);
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

  // Get current user ID from Supabase
  const getUserId = () => {
    const userId = user?.id || user?.email || 'demo-user';
    console.log('🔍 GoogleSheetsConnect - getUserId:', userId, 'User:', user?.email || 'No user');
    return userId;
  };

  // Extract spreadsheet ID from Google Sheets URL
  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url; // Return ID if found, otherwise assume it's already an ID
  };

  // Convert Google Sheets URL to CSV export URL
  const getCSVExportUrl = (url: string) => {
    const spreadsheetId = extractSpreadsheetId(url);
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
  };

  // Parse CSV data and create KPI metrics
  const parseCSVAndCreateKPIs = async (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      const dataRows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/['"]/g, ''))
      );

      // Look for common KPI column patterns
      const kpiMetrics: any[] = [];
      const currentDate = new Date();

      for (const row of dataRows) {
        for (let i = 0; i < headers.length; i++) {
          const header = headers[i].toLowerCase();
          const value = parseFloat(row[i]);
          
          if (isNaN(value)) continue; // Skip non-numeric values

          let metricName = null;
          
          // Map common column names to KPI metrics
          if (header.includes('mrr') || header.includes('monthly recurring revenue')) {
            metricName = 'MRR';
          } else if (header.includes('revenue') || header.includes('net profit')) {
            metricName = 'NetProfit';
          } else if (header.includes('burn') || header.includes('burn rate')) {
            metricName = 'BurnRate';
          } else if (header.includes('cash') || header.includes('cash on hand')) {
            metricName = 'CashOnHand';
          } else if (header.includes('user') || header.includes('signup') || header.includes('acquisition')) {
            metricName = 'UserSignups';
          } else if (header.includes('runway')) {
            metricName = 'Runway';
          } else if (header.includes('cac') || header.includes('customer acquisition cost')) {
            metricName = 'CAC';
          } else if (header.includes('churn')) {
            metricName = 'ChurnRate';
          } else if (header.includes('conversion')) {
            metricName = 'ConversionRate';
          } else if (header.includes('active users') || header.includes('dau')) {
            metricName = 'ActiveUsers';
          }

          if (metricName) {
            kpiMetrics.push({
              userId: getUserId(), // Use current user ID
              metricName,
              source: 'GoogleSheets',
              value,
              timestamp: currentDate,
              lastSyncedAt: currentDate,
              isManualOverride: false,
              status: 'active'
            });
          }
        }
      }

      return kpiMetrics;
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw error;
    }
  };

  // Import data from Google Sheets URL
  const handleImportFromURL = async () => {
    if (!spreadsheetId.trim()) {
      setMessage('❌ Please enter a Google Sheets URL or ID');
      return;
    }

    setLoading(true);
    setMessage('📊 Importing data from Google Sheets...');

    try {
      const csvUrl = getCSVExportUrl(spreadsheetId);
      
      // Use a CORS proxy or try direct fetch
      let csvText = '';
      try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error('Direct access failed');
        }
        csvText = await response.text();
      } catch (directError) {
        // If direct access fails, use a CORS proxy
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(csvUrl)}`;
        const proxyResponse = await fetch(proxyUrl);
        const proxyData = await proxyResponse.json();
        csvText = proxyData.contents;
      }

      if (!csvText) {
        throw new Error('Failed to fetch CSV data');
      }

      setCsvData(csvText.split('\n').slice(0, 5)); // Preview first 5 rows
      
      // Parse CSV and create KPIs
      const kpiMetrics = await parseCSVAndCreateKPIs(csvText);
      
      if (kpiMetrics.length === 0) {
        setMessage('⚠️ No recognizable KPI metrics found. Please check your column headers include terms like: MRR, Revenue, Burn Rate, Cash, Users, Runway, CAC, Churn, etc.');
        return;
      }

      // Send KPIs to backend
      console.log('💾 Creating KPIs for user:', getUserId(), 'metrics:', kpiMetrics.length);
      const createPromises = kpiMetrics.map(async (kpi) => {
        console.log('💾 Creating KPI:', kpi.metricName, 'for user:', kpi.userId);
        const response = await fetch('/api/kpi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(kpi)
        });
        const result = await response.json();
        console.log('💾 KPI creation result:', result);
        return result;
      });

      await Promise.all(createPromises);
      
      setMessage(`✅ Successfully imported ${kpiMetrics.length} KPI metrics from Google Sheets!`);
      setIsConnected(true);
      
      // Notify parent component
      if (onDataGenerated) {
        onDataGenerated();
      }

    } catch (error) {
      console.error('Import error:', error);
      setMessage(`❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure the sheet is publicly accessible.`);
    } finally {
      setLoading(false);
    }
  };

  // Check if Google Sheets is already connected and handle OAuth callback
  useEffect(() => {
    // Only check connection if user is authenticated
    if (!user) {
      console.log('🔍 GoogleSheetsConnect - No user yet, waiting for authentication...');
      return;
    }

    const checkConnection = async () => {
      try {
        const currentUserId = getUserId();
        console.log('🔍 Checking GoogleSheets connection for user:', currentUserId);
        
        const res = await fetch(`/api/datasources?userId=${currentUserId}`);
        if (res.ok) {
          const data = await res.json();
          console.log('📋 Data sources response:', data);
          const googleSheetsSource = data.dataSources?.find((ds: any) => ds.source === 'GoogleSheets');
          if (googleSheetsSource) {
            console.log('📊 Found GoogleSheets data source:', googleSheetsSource.id);
            setIsConnected(true);
            setSourceId(googleSheetsSource.id);
            setMessage('✅ Connected to Google Sheets');
            // Try to get spreadsheet info if available
            fetchSpreadsheetInfo(googleSheetsSource.id);
          } else {
            console.log('❌ No GoogleSheets data source found for user:', currentUserId);
            setIsConnected(false);
            setSourceId(null);
          }
        } else {
          console.error('❌ Failed to fetch data sources:', res.status);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    // Handle OAuth callback for Google Sheets
    const urlParams = new URLSearchParams(window.location.search);
    const intent = urlParams.get('intent');
    
    if (intent === 'sheets' && user) {
      // User is authenticated via Supabase, create data source
      try {
        const creds = {
          accessToken: 'supabase-oauth-token', // In real implementation, get from Supabase session
          refreshToken: 'supabase-refresh-token', // In real implementation, get from Supabase session
          expiryDate: Date.now() + 3600000, // 1 hour from now
        };
        // Create data source with the credentials
        createDataSource(creds);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        setMessage(`Failed to process authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      checkConnection();
    }
    
    // Also check again after a delay in case localStorage isn't ready immediately
    const timeoutId = setTimeout(() => {
      console.log('🔄 Rechecking connection after delay...');
      checkConnection();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [user]);

  const fetchSpreadsheetInfo = async (id: string) => {
    // This would fetch spreadsheet metadata if needed
    // For now, we'll show basic connection status
  };

  const handleGoogleAuth = async () => {
    setAuthInProgress(true);
    setMessage('');

    try {
      // Use Supabase Google OAuth for Google Sheets access
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?intent=sheets`,
          scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly'
        }
      });
      
      if (error) {
        setAuthInProgress(false);
        setMessage(`Authorization failed: ${error.message}`);
      }
    } catch (error) {
      setAuthInProgress(false);
      setMessage(`Authorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          userId: getUserId(),
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
    if (!sourceId) {
      setMessage('❌ No data source connected. Please connect Google Sheets first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const currentUserId = getUserId();
      console.log('🔄 Starting sync with userId:', currentUserId, 'sourceId:', sourceId);
      
      // Add a longer delay to ensure data source is fully saved and available
      setMessage('⏳ Preparing sync...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage('🔄 Syncing data...');
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId,
          userId: currentUserId
        })
      });

      const data = await res.json();
      console.log('📊 Sync response:', data);
      
      if (res.ok && data.success) {
        setMessage(`✅ Sync completed! ${data.metricsSynced} metrics processed. Check console for details.`);
        
        // Notify parent component to refresh dashboard
        if (onDataGenerated) {
          onDataGenerated();
        }
      } else {
        console.error('Sync failed:', data);
        setMessage(`❌ Sync failed: ${data.error || 'Unknown error'}. Check console for details.`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      setMessage(`❌ Sync failed: ${error instanceof Error ? error.message : 'Network error'}. Please try again.`);
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
        body: JSON.stringify({ userId: getUserId() })
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
      const res = await fetch(`/api/verify-sync?userId=${getUserId()}&source=GoogleSheets&hours=24`);
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
          userId: getUserId(),
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

          {/* OR Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '16px 0',
            gap: '12px'
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'rgba(255, 255, 255, 0.1)'
            }} />
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500'
            }}>or</span>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'rgba(255, 255, 255, 0.1)'
            }} />
          </div>

          {/* Quick Import Button */}
          <button
            onClick={handleImportFromURL}
            disabled={loading || authInProgress || !spreadsheetId.trim()}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (loading || authInProgress || !spreadsheetId.trim()) ? 'not-allowed' : 'pointer',
              opacity: (loading || authInProgress || !spreadsheetId.trim()) ? 0.6 : 1,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              marginBottom: '16px'
            }}
            onMouseEnter={(e) => {
              if (!loading && !authInProgress && spreadsheetId.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !authInProgress) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }
            }}
          >
            📊 Quick Import as CSV
          </button>

          {/* CSV Preview */}
          {csvData.length > 0 && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#10b981',
                marginBottom: '8px'
              }}>CSV Data Preview:</div>
              <div style={{
                fontSize: '11px',
                color: '#9ca3af',
                fontFamily: 'monospace',
                maxHeight: '100px',
                overflow: 'auto'
              }}>
                {csvData.slice(0, 3).map((row, index) => (
                  <div key={index}>{typeof row === 'string' ? row : JSON.stringify(row)}</div>
                ))}
              </div>
            </div>
          )}

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
              <li style={{ marginBottom: '4px' }}>Make sure your Google Sheet is shared with &quot;Anyone with the link can view&quot;</li>
              <li style={{ marginBottom: '4px' }}>Your sheet should have column headers that match KPI names (MRR, Net Profit, etc.)</li>
              <li style={{ marginBottom: '4px' }}>Data should be in rows below the headers</li>
              <li>Click &quot;Connect Google Sheets&quot; to authorize access</li>
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