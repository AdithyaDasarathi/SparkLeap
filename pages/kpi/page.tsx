'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import KPIDashboard from '@/components/KPIDashboard';
import NotionConnect from '@/components/NotionConnect';
import GoogleSheetsConnect from '@/components/GoogleSheetsConnect';
import StripeConnect from '@/components/StripeConnect';
import AppHeader from '@/components/AppHeader';

export default function KPIPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      console.log('🔍 Checking for user in localStorage:', !!userStr);
      
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        console.log('👤 KPI Page loaded for user:', userData.email || userData.name);
      } else {
        // For development: create a demo user if no real user is found
        console.log('⚠️ No user found in localStorage, creating demo user for development');
        const demoUser = {
          id: 'demo-user',
          email: 'demo@sparkleap.com',
          name: 'Demo User',
          picture: null,
          loginAt: new Date().toISOString()
        };
        setUser(demoUser);
        localStorage.setItem('user', JSON.stringify(demoUser));
        console.log('✅ Created demo user for development');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // Redirect to login on error
      router.push('/login');
    }
    setIsLoading(false);
  }, [router]);

  // Callback to refresh the KPI dashboard
  const handleDataGenerated = useCallback(() => {
    console.log('🔄 Refreshing KPI dashboard...');
    setRefreshKey(prev => prev + 1);
  }, []);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0c0c0e, #1a1a1f)',
        color: '#ffffff'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid #ffffff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0e, #1a1a1f)',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Global Header */}
      <AppHeader title="Dashboard" subtitle="Business" />
      
      {/* Background gradient effects */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '-160px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '576px',
          height: '384px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(147, 51, 234, 0.1) 100%)',
          filter: 'blur(60px)',
          animation: 'pulse 3s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '160px',
          left: '80px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
          filter: 'blur(60px)',
          animation: 'pulse 3s ease-in-out infinite',
          animationDelay: '1s'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          right: '40px',
          width: '512px',
          height: '384px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
          filter: 'blur(60px)',
          animation: 'pulse 3s ease-in-out infinite',
          animationDelay: '2s'
        }} />
      </div>

      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 24px'
      }}>
        {/* KPI Dashboard - Main Content */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: '32px',
          overflow: 'hidden',
          marginBottom: '32px'
        }}>
          <KPIDashboard key={refreshKey} userId={user?.id || user?.email || 'demo-user'} />
        </div>

        {/* Data Sources Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            padding: '24px',
            overflow: 'hidden'
          }}>
            <NotionConnect />
          </div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            padding: '24px',
            overflow: 'hidden'
          }}>
            <GoogleSheetsConnect onDataGenerated={handleDataGenerated} />
          </div>
          <div style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            padding: "24px",
            overflow: "hidden"
          }}>
            <StripeConnect onDataGenerated={handleDataGenerated} />
          </div>
        </div>
      </div>
    </div>
  );
} 