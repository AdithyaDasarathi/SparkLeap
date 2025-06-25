'use client';

import React, { useState, useEffect } from 'react';
import { KPI, KPIMetric, KPI_METRICS, KPITrend } from '../types/kpi';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface KPIDashboardProps {
  userId: string;
}

export default function KPIDashboard({ userId }: KPIDashboardProps) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [trends, setTrends] = useState<Record<KPIMetric, KPITrend>>({} as Record<KPIMetric, KPITrend>);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<KPIMetric | null>(null);

  useEffect(() => {
    fetchKPIs();
  }, [userId]);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kpi?userId=${userId}`);
      const data = await response.json();
      
      if (data.kpis) {
        setKpis(data.kpis);
        
        // Fetch trends for each metric
        const trendData: Record<KPIMetric, KPITrend> = {} as Record<KPIMetric, KPITrend>;
        for (const metric of Object.keys(KPI_METRICS) as KPIMetric[]) {
          const trendResponse = await fetch(`/api/kpi?userId=${userId}&metricName=${metric}&days=30`);
          const trendDataResponse = await trendResponse.json();
          
          if (trendDataResponse.trends) {
            trendData[metric] = {
              metricName: metric,
              values: trendDataResponse.trends,
              trend: calculateTrend(trendDataResponse.trends),
              percentageChange: calculatePercentageChange(trendDataResponse.trends)
            };
          }
        }
        setTrends(trendData);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (values: Array<{ value: number; timestamp: string }>): 'up' | 'down' | 'stable' => {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-7); // Last 7 days
    const older = values.slice(-14, -7); // 7 days before that
    
    const recentAvg = recent.reduce((sum, v) => sum + v.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v.value, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };

  const calculatePercentageChange = (values: Array<{ value: number; timestamp: string }>): number => {
    if (values.length < 2) return 0;
    
    const latest = values[values.length - 1].value;
    const previous = values[values.length - 2].value;
    
    return previous > 0 ? ((latest - previous) / previous) * 100 : 0;
  };

  const getLatestValue = (metricName: KPIMetric): number => {
    const metricKPIs = kpis.filter(kpi => kpi.metricName === metricName);
    if (metricKPIs.length === 0) return 0;
    
    const latest = metricKPIs.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
    
    return latest.isManualOverride ? latest.overrideValue! : latest.value;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
      default:
        return <MinusIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatValue = (value: number, metricName: KPIMetric): string => {
    const metric = KPI_METRICS[metricName];
    const formatted = new Intl.NumberFormat('en-US', {
      style: metric.unit === '$' ? 'currency' : 'decimal',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
    
    if (metric.unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (metric.unit === 'users' || metric.unit === 'visitors') {
      return `${value.toLocaleString()} ${metric.unit}`;
    }
    
    return formatted;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">KPI Dashboard</h2>
        <button
          onClick={fetchKPIs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(KPI_METRICS).map(([metricName, metric]) => {
          const value = getLatestValue(metricName as KPIMetric);
          const trend = trends[metricName as KPIMetric];
          const percentageChange = trend?.percentageChange || 0;
          
          return (
            <div
              key={metricName}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedMetric(metricName as KPIMetric)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{metric.label}</h3>
                {trend && getTrendIcon(trend.trend)}
              </div>
              <div className="h-8 w-full mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend && trend.values.length > 0 ? trend.values.map(v => ({
                    ...v,
                    timestamp: new Date(v.timestamp).toLocaleDateString()
                  })) : [
                    { timestamp: '2024-06-01', value: 100 },
                    { timestamp: '2024-06-02', value: 120 },
                    { timestamp: '2024-06-03', value: 140 }
                  ]}>
                    <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {formatValue(value, metricName as KPIMetric)}
              </div>
              
              {trend && (
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    percentageChange > 0 ? 'text-green-600' : 
                    percentageChange < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500">vs last period</span>
                </div>
              )}
              
              <p className="text-sm text-gray-600 mt-2">{metric.description}</p>
            </div>
          );
        })}
      </div>

      {/* Trend Chart Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {KPI_METRICS[selectedMetric].label} - 30 Day Trend
              </h3>
              <button
                onClick={() => setSelectedMetric(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              {trends[selectedMetric] && trends[selectedMetric].values.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends[selectedMetric].values.map(v => ({
                    ...v,
                    timestamp: new Date(v.timestamp).toLocaleDateString()
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { timestamp: '2024-06-01', value: 100 },
                    { timestamp: '2024-06-02', value: 120 },
                    { timestamp: '2024-06-03', value: 140 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900">Current Value</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {formatValue(getLatestValue(selectedMetric), selectedMetric)}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Trend</h4>
                <div className="flex items-center space-x-2">
                  {trends[selectedMetric] && getTrendIcon(trends[selectedMetric].trend)}
                  <span className="text-lg font-medium">
                    {trends[selectedMetric]?.trend === 'up' ? 'Increasing' :
                     trends[selectedMetric]?.trend === 'down' ? 'Decreasing' : 'Stable'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 