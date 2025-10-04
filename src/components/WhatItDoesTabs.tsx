'use client';

import React from 'react';

type Tab = {
  key: string;
  title: string;
  description: string;
};

const TABS: Tab[] = [
  {
    key: 'goals',
    title: 'Create Your Goals',
    description:
      'Define clear, measurable goals. Align your team and track progress in one place with weekly focus.'
  },
  {
    key: 'projects',
    title: 'Create Projects',
    description:
      'Spin up projects in seconds. Organize workstreams and ship consistently without the chaos.'
  },
  {
    key: 'schedule',
    title: 'Smart Scheduling',
    description:
      'Let Smart Scheduling plan the perfect week. Auto‑prioritized tasks and balanced workload.'
  },
  {
    key: 'tasks',
    title: 'Create Tasks',
    description:
      'Capture work quickly. Assign, set due dates, and keep momentum with AI nudges + summaries.'
  }
];

export default function WhatItDoesTabs() {
  const [active, setActive] = React.useState<string>(TABS[0].key);
  const tab = TABS.find(t => t.key === active)!;

  return (
    <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', margin: 0, marginBottom: 24, fontSize: 'clamp(26px,4.2vw,48px)', fontWeight: 400, color: '#ffffff' }}>What You Can Do With Us</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: '28px', alignItems: 'start' }}>
        {/* Left column - tabs */}
        <div>
          <div style={{ display: 'grid', gap: 10 }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                style={{
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.92)',
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: active === t.key ? 1 : 0.75
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: 2, background: active === t.key ? 'linear-gradient(135deg, #FF8669, #DA595D)' : 'rgba(255,255,255,0.2)' }} />
                {t.title}
              </button>
            ))}
          </div>

          <p style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, maxWidth: 420 }}>{tab.description}</p>
        </div>

        {/* Right preview card */}
        <div style={{
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'radial-gradient(120% 120% at 20% 10%, rgba(255,134,105,0.12), rgba(0,0,0,0) 40%), radial-gradient(120% 120% at 85% 90%, rgba(218,89,93,0.14), rgba(0,0,0,0) 40%), rgba(255,255,255,0.03)',
          padding: 16,
          minHeight: 220,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
        }}>
          {/* Simple placeholder that changes with tab title */}
          <div style={{
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 12,
            background: 'radial-gradient(ellipse at 30% 20%, rgba(249, 115, 22, 0.15), transparent 40%), radial-gradient(ellipse at 70% 80%, rgba(220, 38, 38, 0.15), transparent 40%), rgba(0,0,0,0.65)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)',
            fontSize: 16, letterSpacing: 0.3
          }}>
            {tab.title}
          </div>
        </div>
      </div>
    </div>
  );
}


