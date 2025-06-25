'use client';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
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

  if (loading) return <div className="py-8 text-center">Loading KPI charts...</div>;

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* MRR Line Chart */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg mb-2">MRR Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={kpiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="MRR" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* CAC + LTV Bar Chart */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg mb-2">CAC vs. LTV</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={kpiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="CAC" fill="#82ca9d" />
            <Bar dataKey="LTV" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* DAU and WAU Line Chart */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg mb-2">Active Users (DAU & WAU)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={kpiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="DAU" stroke="#2563eb" />
            <Line type="monotone" dataKey="WAU" stroke="#f59e42" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Website Traffic and Conversion Rate */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg mb-2">Website Traffic & Conversion</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={kpiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="WebsiteTraffic" stroke="#10b981" />
            <Line yAxisId="right" type="monotone" dataKey="LeadConversionRate" stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Burn Rate Line Chart */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg mb-2">Burn Rate</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={kpiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="BurnRate" stroke="#f43f5e" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 