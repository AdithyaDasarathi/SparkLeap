'use client';

import React, { useState, useEffect } from 'react';
import { 
  KPI, 
  KPIMetric, 
  KPI_METRICS, 
  CORE_KPI_METRICS, 
  CUSTOMIZABLE_KPI_METRICS,
  KPITrend 
} from '../types/kpi';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  MinusIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import { LineChart } from 'recharts/lib/chart/LineChart';
import { BarChart } from 'recharts/lib/chart/BarChart';
import { AreaChart } from 'recharts/lib/chart/AreaChart';
import { ComposedChart } from 'recharts/lib/chart/ComposedChart';
import { PieChart } from 'recharts/lib/chart/PieChart';
import { Line } from 'recharts/lib/cartesian/Line';
import { Bar } from 'recharts/lib/cartesian/Bar';
import { Area } from 'recharts/lib/cartesian/Area';
import { XAxis } from 'recharts/lib/cartesian/XAxis';
import { YAxis } from 'recharts/lib/cartesian/YAxis';
import { CartesianGrid } from 'recharts/lib/cartesian/CartesianGrid';
import { Tooltip } from 'recharts/lib/component/Tooltip';
import { ResponsiveContainer } from 'recharts/lib/component/ResponsiveContainer';
import { ReferenceLine } from 'recharts/lib/cartesian/ReferenceLine';
import { Pie } from 'recharts/lib/polar/Pie';
import { Cell } from 'recharts/lib/component/Cell';

interface KPIDashboardProps {
  userId: string;
}

export default function KPIDashboard({ userId }: KPIDashboardProps) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [trends, setTrends] = useState<Record<KPIMetric, KPITrend>>({} as Record<KPIMetric, KPITrend>);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<KPIMetric | null>(null);
  const [visibleCustomKPIs, setVisibleCustomKPIs] = useState<KPIMetric[]>([]);
  const [showAddKPIModal, setShowAddKPIModal] = useState(false);
  const [addDataModal, setAddDataModal] = useState<{ metric: KPIMetric | null, open: boolean }>({ metric: null, open: false });
  const [newDataValue, setNewDataValue] = useState('');
  const [newDataDate, setNewDataDate] = useState('');
  const [editGraphModal, setEditGraphModal] = useState<{ metric: KPIMetric | null, open: boolean }>({ metric: null, open: false });
  const [editGraphData, setEditGraphData] = useState<{ value: string; date: string }[]>([]);

  useEffect(() => {
    console.log('🔄 KPI Dashboard mounted, fetching KPIs for user:', userId);
    fetchKPIs();
  }, [userId]);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching KPIs for user:', userId);
      const response = await fetch(`/api/kpi?userId=${userId}`);
      const data = await response.json();
      
      if (data.kpis) {
        console.log('📊 Fetched KPIs:', data.kpis.length, 'total KPIs');
        setKpis(data.kpis);
        
        // Fetch trends for each metric
        const trendData: Record<KPIMetric, KPITrend> = {} as Record<KPIMetric, KPITrend>;
        const allMetrics = [...CORE_KPI_METRICS, ...CUSTOMIZABLE_KPI_METRICS];
        
        console.log('📈 Fetching trends for metrics:', allMetrics);
        
        for (const metric of allMetrics) {
          console.log(`📊 Fetching trends for ${metric}...`);
          const trendResponse = await fetch(`/api/kpi?userId=${userId}&metricName=${metric}`);
          const trendDataResponse = await trendResponse.json();
          
          console.log(`📊 ${metric} trends response:`, {
            hasTrends: !!trendDataResponse.trends,
            trendsLength: trendDataResponse.trends?.length || 0,
            sampleData: trendDataResponse.trends?.slice(0, 2) || []
          });
          
          if (trendDataResponse.trends && trendDataResponse.trends.length > 0) {
            trendData[metric] = {
              metricName: metric,
              values: trendDataResponse.trends.map((item: any) => ({
                value: item.value,
                timestamp: new Date(item.timestamp)
              })),
              trend: calculateTrend(trendDataResponse.trends),
              percentageChange: calculatePercentageChange(trendDataResponse.trends)
            };
            console.log(`✅ ${metric} trend created with ${trendDataResponse.trends.length} data points`);
          } else {
            // Generate demo trend data for Core KPIs
            if (CORE_KPI_METRICS.includes(metric)) {
              const demoTrendData = generateDemoTrendData(metric);
              trendData[metric] = {
                metricName: metric,
                values: demoTrendData.map(item => ({
                  value: item.value,
                  timestamp: new Date(item.timestamp)
                })),
                trend: calculateTrend(demoTrendData),
                percentageChange: calculatePercentageChange(demoTrendData)
              };
              console.log(`🎭 Generated demo trend data for ${metric}`);
            } else {
              console.log(`⚠️ No trends data for ${metric}`);
            }
          }
        }
        
        console.log('📈 Final trends data:', Object.keys(trendData).length, 'metrics with trends');
        console.log('📊 KPIs data:', kpis.length, 'total KPIs');
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

  const generateDemoTrendData = (metricName: KPIMetric): Array<{ value: number; timestamp: string }> => {
    const baseValues: Record<KPIMetric, number> = {
      'MRR': 35000,
      'NetProfit': 8000,
      'BurnRate': 12000,
      'CashOnHand': 100000,
      'UserSignups': 200,
      'Runway': 300,
      'CAC': 120,
      'ChurnRate': 2.5,
      'ActiveUsers': 1000,
      'ConversionRate': 2.8,
      'LTV': 2000,
      'DAU': 700,
      'WAU': 1800,
      'WebsiteTraffic': 12000,
      'LeadConversionRate': 2.5,
      'TasksCompleted': 8
    };

    const baseValue = baseValues[metricName] || 1000;
    const data = [];
    const now = new Date();
    
    // Generate 30 days of data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const trend = i < 15 ? 0.02 : 0.01; // Slight upward trend
      const value = baseValue * (1 + trend * (29 - i) / 29) * (1 + variation);
      
      data.push({
        value: Math.max(0, Math.round(value * 100) / 100),
        timestamp: date.toISOString()
      });
    }
    
    return data;
  };

  const getLatestValue = (metricName: KPIMetric): number => {
    const metricKPIs = kpis.filter(kpi => kpi.metricName === metricName);
    if (metricKPIs.length === 0) {
      // Return demo values for Core KPIs if no data exists
      const demoValues: Record<KPIMetric, number> = {
        'MRR': 39035.4,
        'NetProfit': 9991.14,
        'BurnRate': 10403.65,
        'CashOnHand': 125000,
        'UserSignups': 245,
        'Runway': 365,
        'CAC': 150,
        'ChurnRate': 2.1,
        'ActiveUsers': 1250,
        'ConversionRate': 3.2,
        'LTV': 2400,
        'DAU': 850,
        'WAU': 2100,
        'WebsiteTraffic': 15000,
        'LeadConversionRate': 2.8,
        'TasksCompleted': 12
      };
      return demoValues[metricName] || 0;
    }
    
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
    } else if (metric.unit === 'days') {
      return `${value.toFixed(0)} days`;
    }
    
    return formatted;
  };

  const getDataSourceBadge = (metricName: KPIMetric) => {
    const metricKPIs = kpis.filter(kpi => kpi.metricName === metricName);
    if (metricKPIs.length === 0) return null;
    
    // Get the latest KPI for this metric
    const latest = metricKPIs.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
    
    // Show badge for real data sources (not Manual)
    if (latest.source !== 'Manual') {
      const sourceColors = {
        'GoogleSheets': 'bg-green-100 text-green-800',
        'Stripe': 'bg-blue-100 text-blue-800',
        'GoogleAnalytics': 'bg-purple-100 text-purple-800',
        'Airtable': 'bg-orange-100 text-orange-800',
        'Notion': 'bg-gray-100 text-gray-800',
        'CSV': 'bg-yellow-100 text-yellow-800'
      };
      
      const colorClass = sourceColors[latest.source] || 'bg-gray-100 text-gray-800';
      
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
          {latest.source}
        </span>
      );
    }
    
    return null;
  };

  const addCustomKPI = (metricName: KPIMetric) => {
    if (!visibleCustomKPIs.includes(metricName)) {
      setVisibleCustomKPIs([...visibleCustomKPIs, metricName]);
    }
    setShowAddKPIModal(false);
  };

  const removeCustomKPI = (metricName: KPIMetric) => {
    setVisibleCustomKPIs(visibleCustomKPIs.filter(kpi => kpi !== metricName));
  };

  const renderChart = (metricName: KPIMetric, trend: KPITrend | undefined) => {
    const metric = KPI_METRICS[metricName];
    const data = trend?.values || [];
    const goal = metric.goal || 0;

    console.log(`📊 Rendering chart for ${metricName}:`, {
      hasTrend: !!trend,
      dataLength: data.length,
      sampleData: data.slice(0, 2),
      chartType: metric.chartType
    });

    switch (metric.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={data.length > 0 ? data : [{ value: 0, timestamp: new Date() }]}> 
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="timestamp" tickFormatter={(v: any) => new Date(v).toLocaleDateString()} fontSize={10} stroke="rgba(255, 255, 255, 0.6)" />
              <YAxis fontSize={10} stroke="rgba(255, 255, 255, 0.6)" />
              <Tooltip 
                labelFormatter={(v: any) => new Date(v).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: 'rgba(12, 12, 14, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#f97316" 
                strokeWidth={3} 
                dot={false} 
                isAnimationActive={false} 
              />
              {goal > 0 && (
                <ReferenceLine y={goal} stroke="#ef4444" strokeDasharray="3 3" />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={data.length > 0 ? data : [{ value: 0, timestamp: new Date() }]}> 
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="timestamp" tickFormatter={(v: any) => new Date(v).toLocaleDateString()} fontSize={10} stroke="rgba(255, 255, 255, 0.6)" />
              <YAxis fontSize={10} stroke="rgba(255, 255, 255, 0.6)" />
              <Tooltip 
                labelFormatter={(v: any) => new Date(v).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: 'rgba(12, 12, 14, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Bar 
                dataKey="value" 
                fill={(data[data.length - 1]?.value || 0) >= 0 ? "#f97316" : "#ef4444"} 
                radius={[4, 4, 0, 0]}
              />
              {goal > 0 && (
                <ReferenceLine y={goal} stroke="#ef4444" strokeDasharray="3 3" />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={data.length > 0 ? data : [{ value: 0, timestamp: new Date() }]}> 
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(v: any) => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={(v: any) => new Date(v).toLocaleDateString()} />
              <Area 
                type="monotone" 
                dataKey="value" 
                fill="#3b82f6" 
                stroke="#2563eb" 
                fillOpacity={0.3}
              />
              {goal > 0 && (
                <ReferenceLine y={goal} stroke="#ef4444" strokeDasharray="3 3" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'sparkline':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={data.length > 0 ? data : [{ value: 0, timestamp: new Date() }]}> 
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(v: any) => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={(v: any) => new Date(v).toLocaleDateString()} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                strokeWidth={1} 
                dot={false} 
                isAnimationActive={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'horizontalBar':
        // Always show a bar chart with axes for Runway (Days)
        const chartData = data.length > 1
          ? data.map(d => ({ ...d, timestamp: typeof d.timestamp === 'string' ? d.timestamp : new Date(d.timestamp).toISOString() }))
          : [
              { value: data[0]?.value || 0, timestamp: (typeof data[0]?.timestamp === 'string' ? data[0]?.timestamp : new Date().toISOString()) },
              { value: data[0]?.value || 0, timestamp: new Date(new Date().getTime() + 86400000).toISOString() }
            ];
        return (
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={chartData}> 
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(v: any) => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={(v: any) => new Date(v).toLocaleDateString()} />
              <Bar dataKey="value" fill="#f59e42" />
              {goal > 0 && (
                <ReferenceLine y={goal} stroke="#ef4444" strokeDasharray="3 3" />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'donut':
        const currentVal = data[data.length - 1]?.value || 0;
        const retained = 100 - currentVal;
        const donutData = [
          { name: 'Retained', value: retained, fill: '#f97316' },
          { name: 'Churned', value: currentVal, fill: '#ef4444' }
        ];
        return (
          <div className="flex flex-col items-center w-full">
            <ResponsiveContainer width={80} height={80}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={35}
                  paddingAngle={2}
                  dataKey="value"
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-1">Retained vs Churned</div>
          </div>
        );

      case 'combo':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <ComposedChart data={data.length > 0 ? data : [{ value: 0, timestamp: new Date() }]}> 
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(v: any) => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={(v: any) => new Date(v).toLocaleDateString()} />
              <Bar dataKey="value" fill="#f59e0b" />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#ef4444" 
                strokeWidth={2} 
                dot={false} 
              />
              {goal > 0 && (
                <ReferenceLine y={goal} stroke="#ef4444" strokeDasharray="3 3" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        // Fallback: show a line chart with axes
        const safeData = data.length > 0
          ? data.map(d => ({ ...d, timestamp: typeof d.timestamp === 'string' ? d.timestamp : new Date(d.timestamp).toISOString() }))
          : [{ value: 0, timestamp: new Date().toISOString() }];
        return (
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={safeData}> 
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(v: any) => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={(v: any) => new Date(v).toLocaleDateString()} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  // Add data point to custom KPI (in-memory only)
  const handleAddData = () => {
    if (!addDataModal.metric || !newDataValue) return;
    const metric = addDataModal.metric;
    const date = newDataDate ? new Date(newDataDate) : new Date();
    const dateStr = date.toISOString();
    const value = parseFloat(newDataValue); 
    if (isNaN(value)) return;
    // Add to trends in-memory
    setTrends(prev => {
      const prevTrend = prev[metric] || { metricName: metric, values: [], trend: 'stable', percentageChange: 0 };
      // Ensure all timestamps are strings
      const newValues = [...prevTrend.values, { value, timestamp: dateStr }].map(v => ({ ...v, timestamp: typeof v.timestamp === 'string' ? v.timestamp : v.timestamp.toISOString() }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return {
        ...prev,
        [metric]: {
          ...prevTrend,
          values: newValues,
          trend: calculateTrend(newValues),
          percentageChange: calculatePercentageChange(newValues)
        }
      };
    });
    setAddDataModal({ metric: null, open: false });
    setNewDataValue('');
    setNewDataDate('');
  };

  // Open edit graph modal and load data points
  const handleOpenEditGraph = (metric: KPIMetric) => {
    const trend = trends[metric];
    setEditGraphData(
      (trend?.values || []).map(v => ({
        value: v.value.toString(),
        date: v.timestamp ? new Date(v.timestamp).toISOString().slice(0, 10) : ''
      }))
    );
    setEditGraphModal({ metric, open: true });
  };

  // Save edited data points
  const handleSaveEditGraph = () => {
    if (!editGraphModal.metric) return;
    const metric = editGraphModal.metric;
    // Filter out empty rows
    const filtered = editGraphData.filter(row => row.value && row.date);
    // Sort by date
    const sorted = filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Prepare data points with string timestamps
    const dataPoints = sorted.map(row => ({ value: parseFloat(row.value), timestamp: new Date(row.date).toISOString() }));
    // Update trends
    setTrends(prev => {
      return {
        ...prev,
        [metric]: {
          metricName: metric,
          values: dataPoints,
          trend: calculateTrend(dataPoints),
          percentageChange: calculatePercentageChange(dataPoints)
        }
      };
    });
    setEditGraphModal({ metric: null, open: false });
    setEditGraphData([]);
  };

  // Add a new row for a new data point
  const handleAddEditGraphRow = () => {
    setEditGraphData([...editGraphData, { value: '', date: '' }]);
  };

  // Remove a row
  const handleRemoveEditGraphRow = (idx: number) => {
    setEditGraphData(editGraphData.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '256px',
        background: 'linear-gradient(135deg, rgba(12, 12, 14, 0.95), rgba(20, 20, 25, 0.95))',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(59, 130, 246, 0.3)',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      background: 'linear-gradient(135deg, rgba(12, 12, 14, 0.95), rgba(20, 20, 25, 0.95))',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      minHeight: '500px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #ffffff, #f97316, #dc2626)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          whiteSpace: 'nowrap',
          margin: 0
        }}>KPI Dashboard</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddKPIModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #f97316, #dc2626)',
              color: '#000000',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(-1px)';
              target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
            }}
          >
            <PlusIcon style={{ width: '14px', height: '14px' }} />
            <span>Add KPI</span>
          </button>
          <button
            onClick={fetchKPIs}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#ffffff',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(-1px)';
              target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Core KPIs */}
      <div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #ffffff, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Core KPIs</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          maxHeight: '500px',
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          {CORE_KPI_METRICS.map((metricName) => {
            console.log(`🎯 Rendering KPI: ${metricName}`);
            const value = getLatestValue(metricName);
            const trend = trends[metricName];
            const percentageChange = trend?.percentageChange || 0;
            const metric = KPI_METRICS[metricName];
            return (
              <div
                key={metricName}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => setSelectedMetric(metricName)}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLDivElement;
                  target.style.transform = 'translateY(-4px)';
                  target.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                  target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLDivElement;
                  target.style.transform = 'translateY(0)';
                  target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  target.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#ffffff',
                    margin: 0
                  }}>{metric.label}</h3>
                  {getDataSourceBadge(metricName)}
                </div>
                <span style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: '8px',
                  background: 'linear-gradient(135deg, #ffffff, #f97316)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>{formatValue(value, metricName)}</span>
                {trend && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: percentageChange > 0 ? '#f97316' : 
                             percentageChange < 0 ? '#ef4444' : '#6b7280'
                    }}>
                      {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>vs last period</span>
                  </div>
                )}
                <div style={{
                  width: '100%',
                  height: '80px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1))',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Subtle gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(59, 130, 246, 0.05))',
                    pointerEvents: 'none'
                  }} />
                  {renderChart(metricName, trend)}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <button
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#000000',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={e => { e.stopPropagation(); handleOpenEditGraph(metricName); }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.transform = 'scale(1)';
                    }}
                  >
                    Edit Graph
                  </button>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: 0,
                  lineHeight: '1.4'
                }}>{metric.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customizable KPIs */}
      {visibleCustomKPIs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCustomKPIs.map((metricName) => {
              const value = getLatestValue(metricName);
              const trend = trends[metricName];
              const percentageChange = trend?.percentageChange || 0;
              const metric = KPI_METRICS[metricName];
              return (
                <div
                  key={metricName}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow relative flex flex-col justify-between min-h-[260px]"
                  style={{ minHeight: 280 }}
                >
                  <button
                    onClick={() => removeCustomKPI(metricName)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{metric.label}</h3>
                    {getDataSourceBadge(metricName)}
                  </div>
                  <span className="text-3xl font-bold text-gray-900 mb-1">{formatValue(value, metricName)}</span>
                  {trend && (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-sm font-medium ${
                        percentageChange > 0 ? 'text-green-600' : 
                        percentageChange < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-500">vs last period</span>
                    </div>
                  )}
                  <div className="w-full h-24 mb-2 flex items-center justify-center">
                    {renderChart(metricName, trend)}
                  </div>
                  <div className="flex space-x-2 mb-2">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                      onClick={() => setAddDataModal({ metric: metricName, open: true })}
                    >
                      Add Data
                    </button>
                    <button
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                      onClick={e => { e.stopPropagation(); handleOpenEditGraph(metricName); }}
                    >
                      Edit Graph
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-auto">{metric.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add KPI Modal */}
      {showAddKPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Custom KPI</h3>
              <button
                onClick={() => setShowAddKPIModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2">
              {CUSTOMIZABLE_KPI_METRICS
                .filter(metric => !visibleCustomKPIs.includes(metric))
                .map((metricName) => {
                  const metric = KPI_METRICS[metricName];
                  return (
                    <button
                      key={metricName}
                      onClick={() => addCustomKPI(metricName)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{metric.label}</div>
                      <div className="text-sm text-gray-600">{metric.description}</div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Add Data Modal for Custom KPI */}
      {addDataModal.open && addDataModal.metric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Data to {KPI_METRICS[addDataModal.metric].label}</h3>
              <button
                onClick={() => setAddDataModal({ metric: null, open: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={newDataValue}
                  onChange={e => setNewDataValue(e.target.value)}
                  placeholder="Enter value"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={newDataDate}
                  onChange={e => setNewDataDate(e.target.value)}
                />
              </div>
              <div className="flex space-x-2 justify-end">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setAddDataModal({ metric: null, open: false })}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={handleAddData}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Graph Modal for all KPIs */}
      {editGraphModal.open && editGraphModal.metric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Graph for {KPI_METRICS[editGraphModal.metric].label}</h3>
              <button
                onClick={() => setEditGraphModal({ metric: null, open: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left pb-2">Value</th>
                      <th className="text-left pb-2">Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {editGraphData.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="number"
                            className="border border-gray-300 rounded px-2 py-1 w-24"
                            value={row.value}
                            onChange={e => setEditGraphData(editGraphData.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="border border-gray-300 rounded px-2 py-1 w-36"
                            value={row.date}
                            onChange={e => setEditGraphData(editGraphData.map((r, i) => i === idx ? { ...r, date: e.target.value } : r))}
                          />
                        </td>
                        <td>
                          <button
                            className="text-red-500 hover:text-red-700 text-xs"
                            onClick={() => handleRemoveEditGraphRow(idx)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                  onClick={handleAddEditGraphRow}
                >
                  + Add Data Point
                </button>
              </div>
              <div className="flex space-x-2 justify-end">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setEditGraphModal({ metric: null, open: false })}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={handleSaveEditGraph}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Chart Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {KPI_METRICS[selectedMetric].label}
              </h3>
              <button
                onClick={() => setSelectedMetric(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends[selectedMetric]?.values || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value: any) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value: any) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [formatValue(value, selectedMetric), selectedMetric]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563eb" 
                    strokeWidth={2} 
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  />
                  {KPI_METRICS[selectedMetric].goal && (
                    <ReferenceLine 
                      y={KPI_METRICS[selectedMetric].goal} 
                      stroke="#ef4444" 
                      strokeDasharray="3 3"
                      label="Goal"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}