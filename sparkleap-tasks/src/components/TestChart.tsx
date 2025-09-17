'use client';

import { useEffect, useState } from 'react';
import { LineChart } from 'recharts/lib/chart/LineChart';
import { Line } from 'recharts/lib/cartesian/Line';
import { XAxis } from 'recharts/lib/cartesian/XAxis';
import { YAxis } from 'recharts/lib/cartesian/YAxis';
import { CartesianGrid } from 'recharts/lib/cartesian/CartesianGrid';
import { Tooltip } from 'recharts/lib/component/Tooltip';
import { ResponsiveContainer } from 'recharts/lib/component/ResponsiveContainer';

export default function TestChart() {
  const [testData, setTestData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testTrendsData() {
      try {
        setLoading(true);
        console.log('🧪 Testing trends data...');
        
        // Test the debug endpoint
        const debugRes = await fetch('/api/debug/trends?userId=demo-user&metricName=MRR');
        const debugData = await debugRes.json();
        console.log('🧪 Debug trends response:', debugData);
        
        // Test the regular trends endpoint
        const trendsRes = await fetch('/api/kpi?userId=demo-user&metricName=MRR');
        const trendsData = await trendsRes.json();
        console.log('🧪 Regular trends response:', trendsData);
        
        if (trendsData.trends && trendsData.trends.length > 0) {
          setTestData(trendsData.trends);
          console.log('✅ Test data loaded successfully');
        } else {
          console.log('⚠️ No trends data available');
        }
      } catch (error) {
        console.error('❌ Test failed:', error);
      } finally {
        setLoading(false);
      }
    }
    
    testTrendsData();
  }, []);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🧪 Testing Chart Data</h3>
        <p className="text-blue-600">Loading test data...</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">🧪 Chart Data Test</h3>
      
      {testData.length > 0 ? (
        <div>
          <p className="text-blue-600 mb-4">
            ✅ Found {testData.length} data points for MRR
          </p>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-2">MRR Trend Test Chart</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={testData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(v: any) => new Date(v).toLocaleDateString()} 
                  fontSize={10} 
                />
                <YAxis fontSize={10} />
                <Tooltip 
                  labelFormatter={(v: any) => new Date(v).toLocaleDateString()} 
                />
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
          </div>
          
          <div className="mt-4 text-sm text-blue-600">
            <p>Sample data points:</p>
            <ul className="list-disc list-inside mt-1">
              {testData.slice(0, 3).map((point, index) => (
                <li key={index}>
                  {new Date(point.timestamp).toLocaleDateString()}: ${point.value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-red-600 mb-2">❌ No test data available</p>
          <p className="text-sm text-blue-600">
            This means either:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-600 mt-1">
            <li>No KPIs have been synced yet</li>
            <li>Historical data hasn't been generated</li>
            <li>There's an issue with the data fetching</li>
          </ul>
          <p className="text-sm text-blue-600 mt-2">
            Try syncing Google Sheets data and clicking "Generate Trends" first.
          </p>
        </div>
      )}
    </div>
  );
} 