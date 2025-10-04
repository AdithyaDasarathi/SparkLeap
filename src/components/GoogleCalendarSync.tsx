'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '../types/task';

interface GoogleCalendarSyncProps {
  tasks: Task[];
  onSyncComplete?: (result: any) => void;
}

interface Calendar {
  id: string;
  summary: string;
  primary?: boolean;
}

export default function GoogleCalendarSync({ tasks, onSyncComplete }: GoogleCalendarSyncProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('primary');
  const [credentials, setCredentials] = useState<any>(null);

  const handleAuthCode = async (code: string) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (response.ok) {
        setCredentials(data.credentials);
        setIsAuthenticated(true);
        localStorage.setItem('googleCalendarCredentials', JSON.stringify(data.credentials));
        await loadCalendars(data.credentials);
        setMessage('Successfully connected to Google Calendar!');
      } else {
        throw new Error(data.error || 'Failed to authenticate');
      }
    } catch (error) {
      setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if user is already authenticated
    const storedCredentials = localStorage.getItem('googleCalendarCredentials');
    if (storedCredentials) {
      try {
        const creds = JSON.parse(storedCredentials);
        setCredentials(creds);
        setIsAuthenticated(true);
        loadCalendars(creds);
      } catch (error) {
        console.error('Failed to parse stored credentials:', error);
        localStorage.removeItem('googleCalendarCredentials');
      }
    }

    // Handle OAuth callback in same window
    const urlParams = new URLSearchParams(window.location.search);
    const auth = urlParams.get('auth');
    const authMessage = urlParams.get('message');
    const credentials = urlParams.get('credentials');
    
    if (auth === 'success' && credentials) {
      try {
        const creds = JSON.parse(decodeURIComponent(credentials));
        setCredentials(creds);
        setIsAuthenticated(true);
        localStorage.setItem('googleCalendarCredentials', JSON.stringify(creds));
        loadCalendars(creds);
        setMessage('Successfully connected to Google Calendar!');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        setMessage(`Failed to parse credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else if (auth === 'error') {
      setMessage(`Authorization failed: ${authMessage || 'Unknown error'}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadCalendars = async (creds: any) => {
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-calendars',
          credentials: creds
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Calendar fetch failed (${response.status})`);
      }

      const data = await response.json();
      if (!Array.isArray(data.calendars) || data.calendars.length === 0) {
        setMessage('No calendars returned. Make sure Google Calendar API is enabled and re-connect to grant access.');
        // Still allow syncing to primary by default
        setCalendars([{ id: 'primary', summary: 'Primary' }]);
        setSelectedCalendarId('primary');
        return;
      }

      setCalendars(data.calendars);
      const primaryCalendar = data.calendars.find((cal: Calendar) => cal.primary) || data.calendars[0];
      if (primaryCalendar) {
        setSelectedCalendarId(primaryCalendar.id);
      }
    } catch (error) {
      console.error('Failed to load calendars:', error);
      setMessage(`Failed to load calendars: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadRecentEvents = async (creds: any) => {
    try {
      const credentialsParam = encodeURIComponent(JSON.stringify(creds));
      const response = await fetch(`/api/calendar/list?credentials=${credentialsParam}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Recent calendar events:', data.events);
        return data.events;
      }
    } catch (error) {
      console.error('Failed to load recent events:', error);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // Use unified auth endpoint that matches redirect URI in Google Console
      const authUrl = '/api/google/auth';

      console.log('Opening popup with URL:', authUrl);

      // Open Google OAuth in a popup
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes,top=100,left=100'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Listen for the authorization code
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
          setMessage('Authorization cancelled');
        }
      }, 1000);

      // Handle message from popup
      const handleMessage = async (event: MessageEvent) => {
        console.log('Received message:', event.data);
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          await handleAuthCode(event.data.code);
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
          setMessage(`Authorization failed: ${event.data.error}`);
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
          setMessage('Authorization timed out. Please try again.');
        }
      }, 300000);

    } catch (error) {
      console.error('Google auth error:', error);
      setIsLoading(false);
      setMessage(`Authorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSyncTasks = async () => {
    if (!credentials || !tasks.length) {
      setMessage('No tasks to sync or not authenticated');
      return;
    }

    setIsLoading(true);
    setMessage('Syncing tasks to Google Calendar...');

    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync-tasks',
          credentials,
          tasks: tasks.filter(task => task.dueDate && !task.completed),
          calendarId: selectedCalendarId
        })
      });

      const data = await response.json();

      if (response.ok) {
        const details = data.result.errorDetails && data.result.errorDetails.length
          ? ` (errors: ${data.result.errors} — ${data.result.errorDetails.slice(0,3).join('; ')}${data.result.errorDetails.length>3 ? '…' : ''})`
          : '';
        setMessage(`Successfully synced ${data.result.created} new events and updated ${data.result.updated} existing events${details}`);
        onSyncComplete?.(data.result);
      } else {
        throw new Error(data.error || 'Failed to sync tasks');
      }
    } catch (error) {
      setMessage(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setCredentials(null);
    setIsAuthenticated(false);
    setCalendars([]);
    setMessage('');
    localStorage.removeItem('googleCalendarCredentials');
  };

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#ffffff',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📅</span>
          Google Calendar Sync
        </h3>
        
        {isAuthenticated && (
          <button
            onClick={handleDisconnect}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
          >
            Disconnect
          </button>
        )}
      </div>

      {!isAuthenticated ? (
        <div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            Connect your Google Calendar to sync your tasks as events. Tasks with due dates will be automatically synced.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: isLoading 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'linear-gradient(135deg, #4285f4, #34a853)',
                border: 'none',
                color: '#ffffff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(66, 133, 244, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Connecting...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Connect (Popup)
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                window.location.href = '/api/google/auth';
              }}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
            >
              <span>🔄</span>
              Connect (Same Window)
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              Select Calendar:
            </label>
            <select
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '14px'
              }}
            >
              {calendars.map(calendar => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary} {calendar.primary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <button
              onClick={handleSyncTasks}
              disabled={isLoading || !tasks.filter(t => t.dueDate && !t.completed).length}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: isLoading || !tasks.filter(t => t.dueDate && !t.completed).length
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(135deg, #f97316, #dc2626)',
                border: 'none',
                color: '#ffffff',
                cursor: isLoading || !tasks.filter(t => t.dueDate && !t.completed).length ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && tasks.filter(t => t.dueDate && !t.completed).length) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && tasks.filter(t => t.dueDate && !t.completed).length) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Syncing...
                </>
              ) : (
                <>
                  <span>🔄</span>
                  Sync Tasks ({tasks.filter(t => t.dueDate && !t.completed).length} tasks)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          borderRadius: '8px',
          background: message.includes('Success') || message.includes('connected')
            ? 'rgba(34, 197, 94, 0.1)'
            : message.includes('Failed') || message.includes('Error')
            ? 'rgba(239, 68, 68, 0.1)'
            : 'rgba(59, 130, 246, 0.1)',
          border: `1px solid ${
            message.includes('Success') || message.includes('connected')
              ? 'rgba(34, 197, 94, 0.3)'
              : message.includes('Failed') || message.includes('Error')
              ? 'rgba(239, 68, 68, 0.3)'
              : 'rgba(59, 130, 246, 0.3)'
          }`,
          color: message.includes('Success') || message.includes('connected')
            ? '#4ade80'
            : message.includes('Failed') || message.includes('Error')
            ? '#fca5a5'
            : '#60a5fa',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
