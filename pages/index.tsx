import HeroParallax from '@/components/HeroParallax';
import Navigation from '@/components/Navigation';
import WhatItDoesTabs from '@/components/WhatItDoesTabs';
import KPIDashboardPreview from '@/components/KPIDashboardPreview';
import { useEffect } from 'react';

export default function Home() {
  // Check if user is already logged in and redirect to dashboard
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      // User is logged in, redirect to dashboard
      window.location.href = '/kpi';
    }
  }, []);
  return (
    <main style={{
      position: 'relative',
      minHeight: '100vh',
      overflow: 'visible',
      // Deep onyx with subtle vignette + warm gradient wash
      background: `radial-gradient(1200px 600px at 50% -10%, rgba(255, 88, 24, 0.35), rgba(0,0,0,0) 60%),
                   radial-gradient(900px 500px at 85% 20%, rgba(220, 38, 38, 0.30), rgba(0,0,0,0) 60%),
                   radial-gradient(900px 500px at 10% 35%, rgba(14, 165, 233, 0.22), rgba(0,0,0,0) 60%),
                   linear-gradient(180deg, #0b0b0d 0%, #0a0a0c 60%, #09090b 100%)`,
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      scrollBehavior: 'smooth'
    }}>
      {/* Background gradient effects */}
      {/* Navigation Header */}
      <Navigation currentPage="home" />

      <div style={{
        position: 'fixed', // persist on scroll across entire landing page
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
        mixBlendMode: 'screen'
      }}>
        <div style={{
          position: 'absolute',
          top: '-220px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '820px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 40%, rgba(249, 115, 22, 0.5) 0%, rgba(220, 38, 38, 0.4) 55%, rgba(236, 72, 153, 0.25) 100%)',
          filter: 'blur(90px)',
          animation: 'pulse 3s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '140px',
          left: '40px',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 45% 50%, rgba(255,134,105,0.42), rgba(218,89,93,0.28))',
          filter: 'blur(80px)',
          animation: 'pulse 3s ease-in-out infinite',
          animationDelay: '1s'
        }} />
        {/* Mid-page orange glow to enrich dark sections */}
        <div style={{
          position: 'absolute',
          top: '780px',
          left: '12%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, rgba(255,134,105,0.35), rgba(218,89,93,0.22))',
          filter: 'blur(85px)',
          animation: 'pulse 4s ease-in-out infinite',
          animationDelay: '1.5s'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          right: '0px',
          width: '620px',
          height: '440px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 60% 40%, rgba(147, 51, 234, 0.32), rgba(236, 72, 153, 0.22))',
          filter: 'blur(90px)',
          animation: 'pulse 3s ease-in-out infinite',
          animationDelay: '2s'
        }} />
        {/* Lower-page orange glow for deep dark region */}
        <div style={{
          position: 'absolute',
          top: '1600px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, rgba(255,134,105,0.30), rgba(218,89,93,0.18))',
          filter: 'blur(95px)',
          animation: 'pulse 5s ease-in-out infinite',
          animationDelay: '2.5s'
        }} />
        {/* subtle grain overlay for depth */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\' viewBox=\'0 0 140 140\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\' opacity=\'0.03\'/></svg>")',
          backgroundSize: 'auto',
          opacity: 0.5
        }} />
        <HeroParallax />
      </div>

      {/* Hero */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        padding: '64px 24px 80px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1152px',
          margin: '0 auto',
          animation: 'fadeIn 0.8s ease-out',
          width: '100%'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 12px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)'
          }}>
            <span style={{
              marginRight: '8px',
              display: 'inline-block',
              height: '6px',
              width: '6px',
              borderRadius: '50%',
              backgroundColor: '#f97316'
            }} />
            Live demo available
          </div>
          <h1 style={{
            marginTop: '24px',
            fontSize: 'clamp(24px, 4vw, 60px)',
            fontWeight: 400,
            lineHeight: '1.1',
            color: '#ffffff',
            wordWrap: 'break-word',
            hyphens: 'auto'
          }}>
            The AI Cofounder That Turns Chaos Into Growth
          </h1>
          <p style={{
            margin: '20px auto 0',
            maxWidth: '512px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 'clamp(16px, 2.5vw, 18px)',
            lineHeight: '1.6',
            wordWrap: 'break-word'
          }}>
            Centralize goals, automate execution, and watch your business move forward while you sleep.
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            maxWidth: '400px',
            margin: '32px auto 0'
          }}>
            <a href="/login-supabase" style={{
              display: 'inline-flex',
              height: '44px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #FF8669, #DA595D)',
              padding: '0 24px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#0b0b0d',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 24px rgba(218, 89, 93, 0.35)'
            }}>
              Get Started
            </a>
            <a href="#demo" style={{
              display: 'inline-flex',
              height: '44px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
              padding: '0 24px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              textDecoration: 'none',
              transition: 'all 0.3s ease'
            }}>
              Watch Demo
            </a>
          </div>

          {/* Dashboard preview bar */}
          <div style={{ marginTop: '48px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.3)', padding: '8px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(10px)' }}>
            <KPIDashboardPreview />
          </div>
        </div>
      </section>

      {/* Watch Your Cofounder at Work */}
      <section id="demo" style={{
        position: 'relative',
        zIndex: 10,
        padding: '40px 24px 72px'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316' }} />
              Watch Your Cofounder at Work
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>2 min demo</div>
          </div>

          <div style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ aspectRatio: '16/9', width: '100%', background: 'radial-gradient(ellipse at 30% 20%, rgba(249, 115, 22, 0.15), transparent 40%), radial-gradient(ellipse at 70% 80%, rgba(220, 38, 38, 0.15), transparent 40%), rgba(0,0,0,0.65)' }} />
            <button aria-label="Play demo" style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '56px',
              height: '56px',
              borderRadius: '9999px',
              border: 'none',
              background: 'linear-gradient(135deg, #FF8669, #DA595D)',
              boxShadow: '0 10px 30px rgba(218, 89, 93, 0.35)',
              cursor: 'pointer'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000" width="24" height="24" style={{ marginLeft: '4px' }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      

      {/* Why SparkLeap */}
      <section id="why" style={{
        position: 'relative',
        zIndex: 10,
        padding: '16px 24px 64px'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              Why SparkLeap
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            <div style={{
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))',
              padding: '24px'
            }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Focus</div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Reduce chaos, increase velocity</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>One place to set goals, track KPIs, and execute without context switching.</div>
            </div>
            <div style={{
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))',
              padding: '24px'
            }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Outcomes</div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Ship measurable results, every week</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Automations and checklists turn strategy into shipped work and visible wins.</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Do With Us */}
      <section id="what-it-does" style={{ position: 'relative', zIndex: 10, padding: '48px 24px 80px' }}>
        <WhatItDoesTabs />
      </section>

      {/* Logos */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '32px 0'
      }}>
        <div style={{
          maxWidth: '1152px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '40px 40px',
          padding: '0 24px',
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          <span>Stripe</span>
          <span>Google Sheets</span>
          <span>Notion</span>
          <span>Google Calendar</span>
        </div>
      </section>

      {/* (Removed) legacy two-card grid */}

      {/* Removed legacy Capabilities grid */}

      {/* Built by founders */}
      <section id="built" style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '64px 24px'
      }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '24px'
          }}>Built By Founders For Founders</h3>
          <div style={{
            display: 'grid',
            gap: '24px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
          }}>
            {[1,2,3].map((i) => (
              <div key={i} style={{
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '24px',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.5'
              }}>
                Actionable dashboards, focused execution, and AI assistance when you need it.
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" style={{
        position: 'relative',
        zIndex: 10,
        padding: '64px 24px'
      }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <h3 style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '24px'
          }}>FAQs</h3>
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            overflow: 'hidden'
          }}>
            {[
              {q: 'How does SparkLeap connect to my tools?', a: 'Use built-in integrations (Notion, Google Sheets, Stripe, and more).'},
              {q: 'Is there a free trial?', a: 'Yes — try the product workflow with demo data.'},
              {q: 'Can I invite my team?', a: 'Team features are supported; assign tasks and share dashboards.'},
            ].map((f, idx) => (
              <div key={idx} style={{
                padding: '20px',
                borderBottom: idx < 2 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '4px'
                }}>{f.q}</div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>{f.a}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <a href="/login-supabase" style={{
              display: 'inline-flex',
              height: '44px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #FF8669, #DA595D)',
              padding: '0 24px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#0b0b0d',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 24px rgba(218, 89, 93, 0.35)'
            }}>
              Start Now
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '32px 24px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        © {new Date().getFullYear()} SparkLeap. All rights reserved.
      </footer>
    </main>
  );
}