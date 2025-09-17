'use client';

import React, { useEffect, useState } from 'react';
import { ResponsiveContainer } from 'recharts/lib/component/ResponsiveContainer';
import { LineChart } from 'recharts/lib/chart/LineChart';
import { Line } from 'recharts/lib/cartesian/Line';
import { BarChart } from 'recharts/lib/chart/BarChart';
import { Bar } from 'recharts/lib/cartesian/Bar';
import { XAxis } from 'recharts/lib/cartesian/XAxis';
import { YAxis } from 'recharts/lib/cartesian/YAxis';
import { Tooltip } from 'recharts/lib/component/Tooltip';
import { CartesianGrid } from 'recharts/lib/cartesian/CartesianGrid';

export default function KPIDashboardPreview() {
  const [data, setData] = useState<any[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMRR() {
      try {
        const res = await fetch('/api/kpi?userId=demo-user&metricName=MRR&days=30');
        const json = await res.json();
        let items = (json.trends || []).map((d: any) => ({
          date: new Date(d.timestamp).toISOString().slice(5, 10),
          value: d.value
        }));
        // Fallback: synthesize preview data if none exists yet
        if (items.length === 0) {
          const now = new Date();
          const synth: any[] = [];
          for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            synth.push({
              date: d.toISOString().slice(5, 10),
              value: 30000 + Math.round(Math.sin((29 - i) / 5) * 1000) + (29 - i) * 150,
            });
          }
          items = synth;
        }
        setData(items);
        setCurrent(items[items.length - 1]?.value ?? null);
      } catch (e) {
        console.error('Preview MRR fetch failed', e);
      } finally {
        setLoading(false);
      }
    }
    fetchMRR();
  }, []);

  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/8',
      borderRadius: '8px',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(249, 115, 22, 0.15), transparent 40%), radial-gradient(ellipse at 70% 80%, rgba(220, 38, 38, 0.15), transparent 40%), rgba(0,0,0,0.65)',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      color: 'rgba(255,255,255,0.9)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>KPI Dashboard</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>MRR (last 30d)</div>
      </div>
      <div style={{ flex: 1, padding: '8px 12px 12px', display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 12 }}>
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 32 }}>Loading…</div>
        ) : data.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 32 }}>No data</div>
        ) : (
          <>
            {/* Left: current MRR number */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Monthly Recurring Revenue</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>${current?.toLocaleString() ?? '—'}</div>
            </div>
            {/* Right: mini bar chart */}
            <div style={{ background: 'transparent' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} width={40} />
                  <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Bar dataKey="value" fill="#FF8669" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


