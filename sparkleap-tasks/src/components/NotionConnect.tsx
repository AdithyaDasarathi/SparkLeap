"use client";

import { useState, useEffect } from 'react';
import TaskManager from './TaskManager';

interface TaskAnalytics {
  weeklyCompletion: number;
  goalAlignment: number;
  productivityTrend: 'up' | 'down' | 'stable';
  topPriorities: string[];
}

export default function NotionConnect() {
  const [token, setToken] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytics | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [showReconnectForm, setShowReconnectForm] = useState(false);
  const [reconnectData, setReconnectData] = useState({
    token: '',
    databaseId: ''
  });
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showUpdateDatabaseForm, setShowUpdateDatabaseForm] = useState(false);
  const [newDatabaseId, setNewDatabaseId] = useState('');
  const [isUpdatingDatabase, setIsUpdatingDatabase] = useState(false);

  // Check if Notion is already connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/datasources?userId=demo-user');
        if (res.ok) {
          const data = await res.json();
          const notionSource = data.dataSources?.find((ds: any) => ds.source === 'Notion');
          if (notionSource) {
            setIsConnected(true);
            setSourceId(notionSource.id);
            fetchTaskAnalytics(notionSource.id);
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };
    checkConnection();
  }, []);

  const fetchTaskAnalytics = async (id: string) => {
    try {
      const res = await fetch(`/api/notion?userId=demo-user&sourceId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setTaskAnalytics(data.taskAnalytics);
      }
    } catch (error) {
      console.error('Error fetching task analytics:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setMessage('');
    console.log('🔗 Connecting to Notion...');
    console.log(`   - Token: ${token ? 'Present' : 'Missing'}`);
    console.log(`   - Database ID: ${databaseId ? 'Present' : 'Missing'}`);
    
    if (!token || !databaseId) {
      setMessage('Please enter both token and database ID');
      setLoading(false);
      return;
    }
    
    const res = await fetch('/api/datasources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'demo-user',
        source: 'Notion',
        credentials: JSON.stringify({ token, databaseId }),
        syncFrequency: 'daily'
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Connection successful:', data);
      console.log(`   - Data source ID: ${data.dataSource.id}`);
      setMessage('Notion connected successfully!');
      setIsConnected(true);
      setSourceId(data.dataSource.id);
      
      // Verify the data source was created
      setTimeout(async () => {
        const verifyRes = await fetch('/api/debug?userId=demo-user');
        if (verifyRes.ok) {
          const debugData = await verifyRes.json();
          console.log('🔍 Verification - Data sources:', debugData);
        }
      }, 1000);
      
      fetchTaskAnalytics(data.dataSource.id);
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.error('❌ Connection failed:', errorData);
      setMessage(`Failed to connect: ${errorData.error || 'Unknown error'}`);
    }
    setLoading(false);
  };

  const handleSync = async () => {
    if (!sourceId) {
      setMessage('No source ID available. Please reconnect to Notion.');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      console.log('🔄 Starting Notion sync...');
      console.log(`   - Source ID: ${sourceId}`);
      console.log(`   - User ID: demo-user`);
      
      // First, let's debug what data sources exist
      const debugRes = await fetch('/api/debug?userId=demo-user');
      if (debugRes.ok) {
        const debugData = await debugRes.json();
        console.log('🔍 Debug info:', debugData);
        
        // Check if our data source exists
        const ourDataSource = debugData.dataSources?.find((ds: any) => ds.id === sourceId);
        if (!ourDataSource) {
          console.error('❌ Our data source not found in debug data');
          setMessage('Data source not found. Please reconnect to Notion.');
          setIsConnected(false);
          setSourceId(null);
          setLoading(false);
          return;
        }
        console.log('✅ Data source found:', ourDataSource);
      }
      
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          sourceId,
          action: 'sync'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Sync response:', data);
        setMessage('Sync completed successfully!');
        fetchTaskAnalytics(sourceId);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Sync failed:', errorData);
        
        // Show debug information if available
        if (errorData.debug) {
          console.log('🔍 Debug info:', errorData.debug);
          setMessage(`Sync failed: ${errorData.error}. Check console for debug info.`);
        } else {
          setMessage(`Sync failed: ${errorData.error || 'Unknown error'}`);
        }
        
        // If it's a "not found" error, suggest reconnecting
        if (errorData.error?.includes('not found')) {
          setMessage('Data source not found. Please reconnect to Notion.');
          setIsConnected(false);
          setSourceId(null);
        }
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      setMessage(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const handleReconnect = async () => {
    if (!reconnectData.token || !reconnectData.databaseId) {
      setMessage('Please enter both token and database ID');
      return;
    }

    setIsReconnecting(true);
    setMessage('');
    
    try {
      console.log('🔗 Reconnecting to Notion...');
      console.log(`   - Token: ${reconnectData.token ? 'Present' : 'Missing'}`);
      console.log(`   - Database ID: ${reconnectData.databaseId ? 'Present' : 'Missing'}`);
      
      const res = await fetch('/api/datasources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          source: 'Notion',
          credentials: JSON.stringify({ token: reconnectData.token, databaseId: reconnectData.databaseId }),
          syncFrequency: 'daily'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Reconnection successful:', data);
        setMessage('Notion reconnected successfully!');
        setIsConnected(true);
        setSourceId(data.dataSource.id);
        setShowReconnectForm(false);
        setReconnectData({ token: '', databaseId: '' });
        fetchTaskAnalytics(data.dataSource.id);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Reconnection failed:', errorData);
        setMessage(`Failed to reconnect: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Reconnection error:', error);
      setMessage(`Reconnection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleClearConnection = async () => {
    if (!sourceId) {
      setIsConnected(false);
      setSourceId(null);
      setTaskAnalytics(null);
      setMessage('Connection cleared. Please reconnect with new credentials.');
      return;
    }

    try {
      console.log('🗑️ Clearing Notion connection...');
      
      const res = await fetch(`/api/datasources/${sourceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user'
        })
      });
      
      if (res.ok) {
        console.log('✅ Connection cleared successfully');
        setMessage('Connection cleared successfully. Please reconnect with new credentials.');
        setIsConnected(false);
        setSourceId(null);
        setTaskAnalytics(null);
        setShowReconnectForm(false);
        setReconnectData({ token: '', databaseId: '' });
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Failed to clear connection:', errorData);
        setMessage(`Failed to clear connection: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Clear connection error:', error);
      setMessage(`Clear connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateDatabaseId = async () => {
    if (!newDatabaseId.trim()) {
      setMessage('Please enter a database ID');
      return;
    }

    if (!sourceId) {
      setMessage('No active connection to update');
      return;
    }

    setIsUpdatingDatabase(true);
    setMessage('');

    try {
      console.log('🔄 Updating database ID...');
      console.log(`   - New Database ID: ${newDatabaseId}`);
      
      const res = await fetch(`/api/datasources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          updateType: 'databaseId',
          newDatabaseId: newDatabaseId
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Database ID updated successfully:', data);
        setMessage('Database ID updated successfully!');
        setShowUpdateDatabaseForm(false);
        setNewDatabaseId('');
        
        // Test the new connection
        setTimeout(() => {
          handleSync();
        }, 1000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Failed to update database ID:', errorData);
        setMessage(`Failed to update database ID: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Update database ID error:', error);
      setMessage(`Update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingDatabase(false);
    }
  };

  return (
    <div style={{ marginBottom: 0 }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, #ffffff, #f97316)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>Connect to Notion</h2>
      
      {!isConnected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              Notion Token
            </label>
            <input
              placeholder="Notion Token"
              value={token}
              onChange={e => setToken(e.target.value)}
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
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              Database ID
            </label>
            <input
              placeholder="Database ID"
              value={databaseId}
              onChange={e => setDatabaseId(e.target.value)}
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
          </div>
          <button
            onClick={handleConnect}
            disabled={loading}
            style={{
              width: '100%',
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
            {loading ? 'Connecting...' : 'Connect to Notion'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                background: '#f97316',
                borderRadius: '50%'
              }}></div>
              <span style={{
                color: '#4ade80',
                fontWeight: '600',
                fontSize: '16px'
              }}>✅ Notion Connected</span>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => setShowUpdateDatabaseForm(!showUpdateDatabaseForm)}
                style={{
                  color: '#60a5fa',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#93c5fd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#60a5fa';
                }}
              >
                Update Database ID
              </button>
              
              <button
                onClick={() => setShowReconnectForm(!showReconnectForm)}
                style={{
                  color: '#60a5fa',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#93c5fd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#60a5fa';
                }}
              >
                Reconnect
              </button>
            </div>
          </div>

          {showUpdateDatabaseForm && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{
                fontWeight: '600',
                color: '#60a5fa',
                marginBottom: '16px',
                fontSize: '16px'
              }}>Update Database ID</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#ffffff',
                    marginBottom: '8px'
                  }}>
                    New Database ID
                  </label>
                  <input
                    type="text"
                    value={newDatabaseId}
                    onChange={(e) => setNewDatabaseId(e.target.value)}
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
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    placeholder="Enter your new database ID"
                  />
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '4px',
                    margin: 0
                  }}>
                    Found in your Notion database URL: notion.so/[database-id]
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleUpdateDatabaseId}
                    disabled={isUpdatingDatabase}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isUpdatingDatabase ? 'not-allowed' : 'pointer',
                      opacity: isUpdatingDatabase ? 0.6 : 1,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isUpdatingDatabase) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isUpdatingDatabase) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                      }
                    }}
                  >
                    {isUpdatingDatabase ? 'Updating...' : 'Update Database ID'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUpdateDatabaseForm(false);
                      setNewDatabaseId('');
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {showReconnectForm && (
            <div style={{
              background: 'rgba(107, 114, 128, 0.1)',
              border: '1px solid rgba(107, 114, 128, 0.2)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{
                fontWeight: '600',
                color: '#d1d5db',
                marginBottom: '16px',
                fontSize: '16px'
              }}>Reconnect to Notion</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#ffffff',
                    marginBottom: '8px'
                  }}>
                    Notion API Token
                  </label>
                  <input
                    type="password"
                    value={reconnectData.token}
                    onChange={(e) => setReconnectData({ ...reconnectData, token: e.target.value })}
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
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    placeholder="Enter your Notion API token"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#ffffff',
                    marginBottom: '8px'
                  }}>
                    Database ID
                  </label>
                  <input
                    type="text"
                    value={reconnectData.databaseId}
                    onChange={(e) => setReconnectData({ ...reconnectData, databaseId: e.target.value })}
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
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    placeholder="Enter your database ID"
                  />
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '4px',
                    margin: 0
                  }}>
                    Found in your Notion database URL: notion.so/[database-id]
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleReconnect}
                    disabled={isReconnecting}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isReconnecting ? 'not-allowed' : 'pointer',
                      opacity: isReconnecting ? 0.6 : 1,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isReconnecting) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isReconnecting) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                      }
                    }}
                  >
                    {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowReconnectForm(false);
                      setReconnectData({ token: '', databaseId: '' });
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={handleSync}
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
              {loading ? 'Syncing...' : 'Sync Tasks'}
            </button>

            <button
              onClick={handleClearConnection}
              disabled={loading}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }
              }}
            >
              {loading ? 'Clearing...' : 'Clear Connection'}
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
          background: 'rgba(34, 197, 94, 0.1)',
          color: '#4ade80',
          border: '1px solid rgba(34, 197, 94, 0.2)'
        }}>
          {message}
        </div>
      )}

      {taskAnalytics && (
        <div style={{
          marginTop: '24px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #ffffff, #f97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Task Analytics</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px'
          }}>
            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '8px'
              }}>Weekly Completion</div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#f97316'
              }}>{taskAnalytics.weeklyCompletion}%</div>
            </div>
            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '8px'
              }}>Goal Alignment</div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#3b82f6'
              }}>{taskAnalytics.goalAlignment}%</div>
            </div>
            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '8px'
              }}>Productivity Trend</div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#f59e0b'
              }}>{getTrendIcon(taskAnalytics.productivityTrend)}</div>
            </div>
            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '8px'
              }}>Top Priorities</div>
              <div style={{
                fontSize: '14px',
                color: '#ffffff',
                fontWeight: '500'
              }}>
                {taskAnalytics.topPriorities.slice(0, 2).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Manager Component */}
      <TaskManager sourceId={sourceId} />
    </div>
  );
} 