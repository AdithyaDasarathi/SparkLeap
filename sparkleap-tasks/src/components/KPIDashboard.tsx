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
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  ReferenceLine,
  FunnelChart,
  Funnel
} from 'recharts';

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
        const allMetrics = [...CORE_KPI_METRICS, ...CUSTOMIZABLE_KPI_METRICS];
        
        for (const metric of allMetrics) {
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
    } else if (metric.unit === 'days') {
      return `${value.toFixed(0)} days`;
    }
    
    return formatted;
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

    switch (metric.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={data.length > 0 ? data : [{ value: 0, timestamp: new Date() }]}> 
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={v => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={2} 
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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={v => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} />
              <Bar 
                dataKey="value" 
                fill={(data[data.length - 1]?.value || 0) >= 0 ? "#10b981" : "#ef4444"} 
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
              <XAxis dataKey="timestamp" tickFormatter={v => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} />
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
              <XAxis dataKey="timestamp" tickFormatter={v => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} />
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
              <XAxis dataKey="timestamp" tickFormatter={v => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} />
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
          { name: 'Retained', value: retained, fill: '#10b981' },
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

      case 'funnel':
        // Show a static funnel with a label
        const funnelData = [
          { name: 'Leads', value: 1000, fill: '#3b82f6' },
          { name: 'Signups', value: 100, fill: '#8b5cf6' },
          { name: 'Activated', value: 50, fill: '#10b981' }
        ];
        return (
          <div className="flex flex-col items-center w-full">
            <ResponsiveContainer width={80} height={80}>
              <FunnelChart>
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive={false}
                />
              </FunnelChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-1">Lead → Signup → Activation</div>
          </div>
        );

      case 'combo':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <ComposedChart data={data.length > 0 ? data : [{ value: 0, timestamp: new Date() }]}> 
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={v => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} />
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
              <XAxis dataKey="timestamp" tickFormatter={v => new Date(v).toLocaleDateString()} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} />
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
      const newValues = [...prevTrend.values, { value, timestamp: dateStr }].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">KPI Dashboard</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddKPIModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add KPI</span>
          </button>
          <button
            onClick={fetchKPIs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Core KPIs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Core KPIs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_KPI_METRICS.map((metricName) => {
            const value = getLatestValue(metricName);
            const trend = trends[metricName];
            const percentageChange = trend?.percentageChange || 0;
            const metric = KPI_METRICS[metricName];
            return (
              <div
                key={metricName}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-between min-h-[260px]"
                onClick={() => setSelectedMetric(metricName)}
                style={{ minHeight: 280 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{metric.label}</h3>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{metric.label}</h3>
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
                {KPI_METRICS[selectedMetric].label} - 30 Day Trend
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
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
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