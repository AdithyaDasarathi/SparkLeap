'use client';
// Removed recharts imports to avoid dependency issues
import { useEffect, useState } from 'react';

const METRICS = [
  'MRR', 'ChurnRate', 'CAC', 'LTV', 'DAU', 'WAU', 'WebsiteTraffic', 'LeadConversionRate', 'BurnRate'
];

export default function KPICharts() {
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch trend data for each metric
      const allData: Record<string, any[]> = {};
      let needsSeed = false;
      for (const metric of METRICS) {
        const res = await fetch(`/api/kpi?userId=demo-user&metricName=${metric}&days=30`);
        const data = await res.json();
        console.log(`Fetched for ${metric}:`, data);
        allData[metric] = data.trends || [];
        if (!data.trends || data.trends.length === 0) needsSeed = true;
      }
      // If any metric is empty, seed dummy data for all metrics
      if (needsSeed) {
        const now = new Date();
        for (let i = 0; i < 30; i++) {
          const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
          const day = date.toISOString();
          const dummy = {
            MRR: 12000 + i * 100,
            ChurnRate: 2 + Math.sin(i / 5) * 0.5,
            CAC: 150 + Math.cos(i / 7) * 10,
            LTV: 2400 + i * 20,
            DAU: 1000 + Math.round(Math.sin(i / 3) * 100),
            WAU: 5000 + Math.round(Math.cos(i / 4) * 200),
            WebsiteTraffic: 20000 + i * 200,
            LeadConversionRate: 2 + Math.sin(i / 6) * 0.3,
            BurnRate: 8000 + i * 50
          };
          for (const metric of METRICS) {
            await fetch('/api/kpi', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: 'demo-user',
                metricName: metric,
                value: (dummy as Record<string, number>)[metric],
                source: 'Manual',
                timestamp: day
              })
            });
          }
        }
        // Refetch after seeding
        return fetchData();
      }
      // Merge by date
      const merged: Record<string, any> = {};
      METRICS.forEach(metric => {
        allData[metric].forEach((entry: any) => {
          const date = new Date(entry.timestamp).toISOString().slice(0, 10);
          if (!merged[date]) merged[date] = { date };
          merged[date][metric] = entry.value;
        });
      });
      // Sort by date
      const mergedArr = Object.values(merged).sort((a: any, b: any) => a.date.localeCompare(b.date));
      console.log('Merged KPI data for charts:', mergedArr);
      setKpiData(mergedArr);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return (
    <div style={{
      padding: '24px',
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.75)'
    }}>Loading KPI charts...</div>
  );

  return (
    <div style={{
      padding: '16px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px'
    }}>
      {/* MRR Line Chart */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        padding: '16px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #ffffff, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>MRR Trend</h3>
        <div style={{
          width: '100%',
          height: '300px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '20px',
          background: 'linear-gradient(45deg, rgba(136, 132, 216, 0.1), transparent)',
          borderRadius: '8px'
        }}>
          {kpiData.slice(-10).map((point, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: `${Math.max(20, (point.MRR / Math.max(...kpiData.map(d => d.MRR || 0))) * 260)}px`,
                background: '#8884d8',
                marginRight: '4px',
                borderRadius: '2px',
                opacity: 0.8
              }}
            />
          ))}
        </div>
      </div>

      {/* CAC + LTV Bar Chart */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        padding: '16px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #ffffff, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>CAC vs. LTV</h3>
        <div style={{
          width: '100%',
          height: '300px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '20px',
          background: 'linear-gradient(45deg, rgba(130, 202, 157, 0.1), transparent)',
          borderRadius: '8px',
          gap: '2px'
        }}>
          {kpiData.slice(-10).map((point, index) => (
            <div key={index} style={{ flex: 1, display: 'flex', gap: '1px', alignItems: 'flex-end' }}>
              <div
                style={{
                  flex: 1,
                  height: `${Math.max(20, (point.CAC / Math.max(...kpiData.map(d => d.CAC || 0))) * 260)}px`,
                  background: '#82ca9d',
                  borderRadius: '2px',
                  opacity: 0.8
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: `${Math.max(20, (point.LTV / Math.max(...kpiData.map(d => d.LTV || 0))) * 260)}px`,
                  background: '#8884d8',
                  borderRadius: '2px',
                  opacity: 0.8
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* DAU and WAU Line Chart */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        padding: '16px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #ffffff, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Active Users (DAU & WAU)</h3>
        <div style={{
          width: '100%',
          height: '300px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '20px',
          background: 'linear-gradient(45deg, rgba(37, 99, 235, 0.1), transparent)',
          borderRadius: '8px'
        }}>
          {kpiData.slice(-10).map((point, index) => (
            <div key={index} style={{ flex: 1, display: 'flex', gap: '1px', alignItems: 'flex-end' }}>
              <div
                style={{
                  flex: 1,
                  height: `${Math.max(20, (point.DAU / Math.max(...kpiData.map(d => d.DAU || 0))) * 260)}px`,
                  background: '#2563eb',
                  borderRadius: '2px',
                  opacity: 0.8
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: `${Math.max(20, (point.WAU / Math.max(...kpiData.map(d => d.WAU || 0))) * 260)}px`,
                  background: '#f59e42',
                  borderRadius: '2px',
                  opacity: 0.8
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Website Traffic and Conversion Rate */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        padding: '16px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #ffffff, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Website Traffic & Conversion</h3>
        <div style={{
          width: '100%',
          height: '300px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '20px',
          background: 'linear-gradient(45deg, rgba(249, 115, 22, 0.1), transparent)',
          borderRadius: '8px'
        }}>
          {kpiData.slice(-10).map((point, index) => (
            <div key={index} style={{ flex: 1, display: 'flex', gap: '1px', alignItems: 'flex-end' }}>
              <div
                style={{
                  flex: 1,
                  height: `${Math.max(20, (point.WebsiteTraffic / Math.max(...kpiData.map(d => d.WebsiteTraffic || 0))) * 260)}px`,
                  background: '#f97316',
                  borderRadius: '2px',
                  opacity: 0.8
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: `${Math.max(20, (point.LeadConversionRate / Math.max(...kpiData.map(d => d.LeadConversionRate || 0))) * 260)}px`,
                  background: '#ef4444',
                  borderRadius: '2px',
                  opacity: 0.8
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Burn Rate Line Chart */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        padding: '16px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #ffffff, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Burn Rate</h3>
        <div style={{
          width: '100%',
          height: '300px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '20px',
          background: 'linear-gradient(45deg, rgba(244, 63, 94, 0.1), transparent)',
          borderRadius: '8px'
        }}>
          {kpiData.slice(-10).map((point, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: `${Math.max(20, (point.BurnRate / Math.max(...kpiData.map(d => d.BurnRate || 0))) * 260)}px`,
                background: '#f43f5e',
                marginRight: '4px',
                borderRadius: '2px',
                opacity: 0.8
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 