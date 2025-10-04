'use client';

import React from 'react';

interface NavigationProps {
  currentPage?: 'home' | 'tasks' | 'calendar' | 'kpi';
}

const Navigation: React.FC<NavigationProps> = ({ currentPage = 'home' }) => {
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    // Only intercept on the landing page
    if (currentPage === 'home') {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };
  // Landing-style header block
  if (currentPage === 'home') {
    return (
      <header style={{ 
        position: 'sticky', 
        top: '0', 
        zIndex: 20, 
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/sparkleap.png" alt="SparkLeap logo" width={24} height={24} style={{ display: 'block' }} />
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#ffffff' }}>SparkLeap</span>
          </div>
          <div style={{ display: 'flex', gap: '22px', margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
            <a href="#what-it-does" onClick={(e) => handleSmoothScroll(e, 'what-it-does')} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textDecoration: 'none', cursor: 'pointer' }}>What It Does</a>
            <a href="#why" onClick={(e) => handleSmoothScroll(e, 'why')} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textDecoration: 'none', cursor: 'pointer' }}>Why SparkLeap</a>
            <a href="#built" onClick={(e) => handleSmoothScroll(e, 'built')} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textDecoration: 'none', cursor: 'pointer' }}>Built By</a>
            <a href="#faqs" onClick={(e) => handleSmoothScroll(e, 'faqs')} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textDecoration: 'none', cursor: 'pointer' }}>FAQ</a>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <a href="/tasks" style={{
              display: 'inline-flex', padding: '8px 14px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #FF8669, #DA595D)', color: '#0b0b0d',
              fontSize: '12px', fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 8px 20px rgba(218, 89, 93, 0.35)'
            }}>Join</a>
          </div>
        </div>
      </header>
    );
  }

  // Default app header
  return (
    <header style={{
      position: 'relative',
      zIndex: 20,
      padding: '20px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Brand logo */}
        <img src="/sparkleap.png" alt="SparkLeap logo" width={32} height={32} style={{ display: 'block' }} />
        <span style={{
          fontSize: '20px',
          fontWeight: 400,
          color: '#ffffff'
        }}>
          SparkLeap
        </span>
      </div>
      
      <nav style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'center'
      }}>
        <a href="/" style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }}>
          🏠 Home
        </a>
        <a href="/tasks" style={{
          padding: '8px 16px',
          borderRadius: '6px',
          background: currentPage === 'tasks' 
            ? 'linear-gradient(135deg, #f97316, #dc2626)'
            : 'rgba(255, 255, 255, 0.05)',
          border: currentPage === 'tasks' 
            ? 'none'
            : '1px solid rgba(255, 255, 255, 0.2)',
          color: currentPage === 'tasks' ? '#000000' : '#ffffff',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 'tasks') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          } else {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== 'tasks') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          } else {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}>
          📋 Tasks
        </a>
        <a href="/calendar" style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: currentPage === 'calendar' 
            ? 'linear-gradient(135deg, #f97316, #dc2626)'
            : 'rgba(255, 255, 255, 0.05)',
          color: currentPage === 'calendar' ? '#000000' : '#ffffff',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 'calendar') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          } else {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== 'calendar') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          } else {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}>
          📅 Calendar
        </a>
        <a href="/kpi" style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: currentPage === 'kpi' 
            ? 'linear-gradient(135deg, #f97316, #dc2626)'
            : 'rgba(255, 255, 255, 0.05)',
          color: currentPage === 'kpi' ? '#000000' : '#ffffff',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 'kpi') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          } else {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== 'kpi') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          } else {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}>
          📊 Dashboard
        </a>
      </nav>
    </header>
  );
};

export default Navigation;