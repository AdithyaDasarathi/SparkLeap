
import React, { useState, useEffect, useRef } from 'react';
import { 
  KPI, 
  KPIMetric, 
  KPI_METRICS, 
  CORE_KPI_METRICS, 
  CUSTOMIZABLE_KPI_METRICS,
  KPITrend 
} from '../types/kpi';
// Note: We're not actually using these icons in the current implementation
// Removing unused imports to prevent potential conflicts
// Using simplified chart implementation instead of recharts to avoid dependency issues
import { generateChatResponse } from '../utils/chatHelper';
import { processTaskInput } from '../utils/taskProcessor';
import type { Message } from '../types/message';
import type { Task } from '../types/task';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

interface KPIDashboardProps {
  userId: string;
}

export default function KPIDashboard({ userId }: KPIDashboardProps) {
  const router = useRouter();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [trends, setTrends] = useState<Record<KPIMetric, KPITrend>>({} as Record<KPIMetric, KPITrend>);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // User state
  const [user, setUser] = useState<any>(null);
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Task state for task creation from chat
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load user tasks
  const loadUserTasks = async (userId: string) => {
    try {
      const response = await fetch(`/api/tasks?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
        console.log('📋 Loaded tasks for user:', userId, '- Count:', data.tasks.length);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  // Save task to database
  const saveTask = async (task: Task, userId: string) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, userId })
      });
      const data = await response.json();
      if (data.success) {
        console.log('💾 Task saved to database:', data.task.id);
        return data.task;
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
    return null;
  };

  useEffect(() => {
    // Load user from Supabase
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          console.log('👤 Loaded user from Supabase:', user.email);
          
          // Fetch KPIs for the specific user
          fetchKPIs(user.id);
          
          // Load user-specific tasks
          loadUserTasks(user.id);
          
          // Initialize chat with personalized welcome message
          setChatMessages([{
            role: 'assistant',
            content: `Welcome back, ${user.user_metadata?.full_name || user.email}! Feel free to ask me anything about your current metrics. How can I help?`
          }]);
        } else {
          console.log('⚠️ No user found in KPIDashboard, redirecting to login');
          router.push('/login-supabase');
        }
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/login-supabase');
      }
    };

    loadUser();
  }, [router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Listen for data refresh events (e.g., after CSV import)
  useEffect(() => {
    const handleDataRefresh = () => {
      console.log('🔄 Data refresh event received, refetching KPIs...');
      if (user) {
        fetchKPIs(user.id);
      }
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, [user]);

  const fetchKPIs = async (userIdentifier?: string) => {
    try {
      setLoading(true);
      const actualUserId = userIdentifier || userId;
      console.log('🔄 Fetching KPIs for user:', actualUserId);
      const response = await fetch(`/api/kpi?userId=${actualUserId}`);
      const data = await response.json();
      
      if (data.kpis) {
        console.log('📊 Fetched KPIs:', data.kpis.length, 'total KPIs');
        setKpis(data.kpis);
        
        // Fetch real trend data for each metric instead of using demo data
        await fetchRealTrendData(actualUserId);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealTrendData = async (userId: string) => {
    try {
      console.log('📊 Fetching real trend data for user:', userId);
      console.log('📊 Current user object:', user);
      const metrics = ['MRR', 'NetProfit', 'UserSignups', 'Runway', 'BurnRate', 'CashOnHand'];
      const trendData: Record<KPIMetric, KPITrend> = {} as Record<KPIMetric, KPITrend>;

      for (const metric of metrics) {
        try {
          console.log(`🔍 Fetching trend data for metric: ${metric}`);
          const response = await fetch(`/api/kpi?userId=${userId}&metricName=${metric}&days=30`);
          const data = await response.json();
          
          console.log(`📊 API response for ${metric}:`, data);
          
          if (data.trends && data.trends.length > 0) {
            console.log(`📈 Found ${data.trends.length} trend points for ${metric}:`, data.trends);
            const values = data.trends.map((trend: any) => ({
              date: new Date(trend.timestamp).toISOString().split('T')[0],
              value: trend.value
            }));
            
            // Calculate trend direction and percentage change
            const latestValue = values[values.length - 1]?.value || 0;
            const previousValue = values[values.length - 2]?.value || latestValue;
            const percentageChange = previousValue > 0 ? ((latestValue - previousValue) / previousValue) * 100 : 0;
            
            trendData[metric as KPIMetric] = {
              metricName: metric as KPIMetric,
              values,
              trend: percentageChange > 0 ? 'up' : 'down',
              percentageChange: Math.abs(percentageChange)
            };
          } else {
            console.log(`⚠️ No trend data found for ${metric}, using demo data`);
            // Fallback to demo data for metrics without real data
            const demoData = generateExactDemoData();
            if (demoData[metric as KPIMetric]) {
              trendData[metric as KPIMetric] = demoData[metric as KPIMetric];
            }
          }
        } catch (error) {
          console.error(`Error fetching trend data for ${metric}:`, error);
          // Use demo data as fallback
          const demoData = generateExactDemoData();
          if (demoData[metric as KPIMetric]) {
            trendData[metric as KPIMetric] = demoData[metric as KPIMetric];
          }
        }
      }

      console.log('📊 Setting real trend data:', Object.keys(trendData));
      setTrends(trendData);
    } catch (error) {
      console.error('Error fetching real trend data:', error);
      // Fallback to demo data
      const demoData = generateExactDemoData();
      setTrends(demoData);
    }
  };

  const generateExactDemoData = (): Record<KPIMetric, KPITrend> => {
    const now = new Date();
    const data: Record<KPIMetric, KPITrend> = {} as Record<KPIMetric, KPITrend>;

    // MRR: $18,200 with +7.2% growth
    data['MRR'] = {
      metricName: 'MRR',
      values: generateTrendData(18200, 7.2, 30),
      trend: 'up',
      percentageChange: 7.2
    };

    // Net Profit: $4,650 with +12.5% growth
    data['NetProfit'] = {
      metricName: 'NetProfit',
      values: generateTrendData(4650, 12.5, 30),
      trend: 'up',
      percentageChange: 12.5
    };

    // User Signups: +1,240 with +12.6% growth
    data['UserSignups'] = {
      metricName: 'UserSignups',
      values: generateTrendData(1240, 12.6, 30),
      trend: 'up',
      percentageChange: 12.6
    };

    // Runway: 48 Days with -12 days change
    data['Runway'] = {
      metricName: 'Runway',
      values: generateTrendData(48, -20, 30),
      trend: 'down',
      percentageChange: -20
    };

    // Burn Rate: $6,200 with +18.4% increase
    data['BurnRate'] = {
      metricName: 'BurnRate',
      values: generateTrendData(6200, 18.4, 30),
      trend: 'up',
      percentageChange: 18.4
    };

    // Cash on Hand: $45,600 with -9.2% decrease
    data['CashOnHand'] = {
      metricName: 'CashOnHand',
      values: generateTrendData(45600, -9.2, 30),
      trend: 'down',
      percentageChange: -9.2
    };

    return data;
  };

  const generateTrendData = (baseValue: number, percentageChange: number, days: number) => {
    const data: { value: number; timestamp: Date }[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add realistic variation
      const variation = (Math.random() - 0.5) * 0.1;
      const trend = percentageChange > 0 ? 0.02 : -0.02;
      const value = baseValue * (1 + trend * (days - i) / days) * (1 + variation);
      
      data.push({
        value: Math.max(0, Math.round(value * 100) / 100),
        timestamp: date
      });
    }
    
    return data;
  };

  // Generate KPI analysis context
  const generateKPIContext = () => {
    const metrics = [
      { key: 'MRR' as KPIMetric, label: 'MRR', value: 18200, change: 7.2 },
      { key: 'NetProfit' as KPIMetric, label: 'Net Profit', value: 4650, change: 12.5 },
      { key: 'UserSignups' as KPIMetric, label: 'User Signups', value: 1240, change: 12.6 },
      { key: 'Runway' as KPIMetric, label: 'Runway (Days)', value: 48, change: -20 },
      { key: 'BurnRate' as KPIMetric, label: 'Burn Rate', value: 6200, change: 18.4 },
      { key: 'CashOnHand' as KPIMetric, label: 'Cash on Hand', value: 45600, change: -9.2 }
    ];

    let context = "Current KPI Dashboard Analysis:\n\n";
    
    metrics.forEach(metric => {
      const trend = trends[metric.key];
      const status = getStatusText(metric.key, metric.change);
      const statusColor = getStatusColor(metric.key, metric.change);
      
      context += `**${metric.label}**: ${formatValue(metric.value, metric.key)} (${metric.change > 0 ? '+' : ''}${metric.change}%) - ${status}\n`;
      
      if (trend && trend.values.length > 0) {
        const latest = trend.values[trend.values.length - 1];
        const previous = trend.values.length > 1 ? trend.values[trend.values.length - 2] : latest;
        const trendDirection = latest.value > previous.value ? 'increasing' : 'decreasing';
        context += `  - Trend: ${trendDirection} from ${formatValue(previous.value, metric.key)} to ${formatValue(latest.value, metric.key)}\n`;
      }
    });

    context += `\nKey Insights:\n`;
    context += `- MRR is growing healthily at 7.2% with $18,200 monthly recurring revenue\n`;
    context += `- Net Profit is strong at $4,650 with 12.5% growth\n`;
    context += `- User Signups are growing rapidly at 12.6% (+1,240 users)\n`;
    context += `- ⚠️ Runway is critically low at only 48 days (decreased by 20%)\n`;
    context += `- ⚠️ Burn Rate is increasing by 18.4% to $6,200\n`;
    context += `- Cash on Hand is decreasing by 9.2% to $45,600\n\n`;
    context += `The main concerns are the decreasing runway and increasing burn rate, which could lead to cash flow issues if not addressed.`;

    return context;
  };

  // Logout functionality
  const handleLogout = () => {
    // Clear local state
    setUser(null);
    setTasks([]);
    setChatMessages([]);
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('user-session-id');
    
    // Redirect to login
    router.push('/login');
  };

  // Chat functionality
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      content: chatInput.trim()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput.trim();
    setChatInput('');
    setIsTyping(true);

    try {
      // First, try to process as a task
      console.log('Processing input for task creation:', currentInput);
      const processedTasks = await processTaskInput(currentInput);
      console.log('Processed tasks result:', processedTasks);
      
      // If tasks were created, handle them
      if (processedTasks && processedTasks.length > 0 && user) {
        const savedTasks: Task[] = [];
        
        // Save each task to database
        for (const task of processedTasks) {
          console.log('Creating task:', task);
          const savedTask = await saveTask(task, user.id || user.email);
          if (savedTask) {
            savedTasks.push(savedTask);
          }
        }

        // Update local state with saved tasks
        if (savedTasks.length > 0) {
          setTasks(prev => [...prev, ...savedTasks]);
        }

        // Add confirmation message after a short delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const taskCount = savedTasks.length;
        const confirmationMessage = taskCount === 1 
          ? `📝 Added task "${savedTasks[0].title}" with ${savedTasks[0].priority.toLowerCase()} priority.`
          : `📝 Added ${taskCount} tasks to your list.`;

        setIsTyping(false);
        setChatMessages(prev => [...prev, { role: 'assistant', content: confirmationMessage }]);
        return;
      }

      // If not a task, handle as a general message with KPI context
      console.log('Generating chat response for:', currentInput);
      const kpiContext = generateKPIContext();
      const enhancedPrompt = `${currentInput}\n\n${kpiContext}`;
      
      const response = await generateChatResponse(enhancedPrompt, tasks);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: response
      }]);
    } catch (error) {
      console.error('Error generating chat response:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('Enter pressed, sending message');
      handleSendMessage();
    }
  };

  const getStatusIcon = (metricName: KPIMetric, percentageChange: number) => {
    switch (metricName) {
      case 'MRR':
        return <div style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '2px' }} />;
      case 'NetProfit':
        return <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />;
      case 'UserSignups':
        return <div style={{ width: '8px', height: '8px', backgroundColor: '#f97316', transform: 'rotate(45deg)' }} />;
      case 'Runway':
        return <div style={{ width: '8px', height: '8px', backgroundColor: '#8b5cf6', borderRadius: '2px' }} />;
      case 'BurnRate':
        return <div style={{ width: '8px', height: '8px', backgroundColor: '#8b5cf6', borderRadius: '2px' }} />;
      case 'CashOnHand':
        return <div style={{ width: '8px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '2px' }} />;
      default:
        return null;
    }
  };

  const getStatusText = (metricName: KPIMetric, percentageChange: number) => {
    switch (metricName) {
      case 'MRR':
        return 'Healthy Growth';
      case 'NetProfit':
        return 'Profitable';
      case 'UserSignups':
        return 'Viral Growth';
      case 'Runway':
        return 'Critically Low';
      case 'BurnRate':
        return 'Rapid Spending';
      case 'CashOnHand':
        return 'Moderate';
      default:
        return '';
    }
  };

  const getStatusColor = (metricName: KPIMetric, percentageChange: number) => {
    switch (metricName) {
      case 'MRR':
      case 'NetProfit':
      case 'UserSignups':
        return '#10b981';
      case 'Runway':
      case 'BurnRate':
        return '#ef4444';
      case 'CashOnHand':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const formatValue = (value: number, metricName: KPIMetric): string => {
    if (metricName === 'MRR' || metricName === 'NetProfit' || metricName === 'BurnRate' || metricName === 'CashOnHand') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } else if (metricName === 'UserSignups') {
      return `+${value.toLocaleString()}`;
    } else if (metricName === 'Runway') {
      return `${value.toFixed(0)} Days`;
    }
    return value.toLocaleString();
  };

  const renderChart = (metricName: KPIMetric, trend: KPITrend | undefined) => {
    const data = trend?.values || [];
    const isPositive = trend?.percentageChange && trend.percentageChange > 0;
    let color = '#10b981';
    let gradientColor = '#10b981';
    
    // Set specific colors based on metric
    switch (metricName) {
      case 'MRR':
        color = '#10b981';
        gradientColor = '#10b981';
        break;
      case 'NetProfit':
        color = '#6b7280';
        gradientColor = '#10b981';
        break;
      case 'UserSignups':
        color = '#6b7280';
        gradientColor = '#10b981';
        break;
      case 'Runway':
        color = '#6b7280';
        gradientColor = '#ef4444';
        break;
      case 'BurnRate':
        color = '#10b981';
        gradientColor = '#10b981';
        break;
      case 'CashOnHand':
        color = '#ef4444';
        gradientColor = '#ef4444';
        break;
    }

    // Simplified chart rendering to avoid recharts issues
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(45deg, ${gradientColor}20, transparent)`,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '4px'
      }}>
        {data.slice(-10).map((point, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              height: `${Math.max(10, (point.value / Math.max(...data.map(d => d.value))) * 100)}%`,
              background: gradientColor,
              marginRight: '1px',
              borderRadius: '1px',
              opacity: 0.8
            }}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0b0b0d'
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

  const metrics = [
    { key: 'MRR' as KPIMetric, label: 'MRR', value: 18200, change: 7.2 },
    { key: 'NetProfit' as KPIMetric, label: 'Net Profit', value: 4650, change: 12.5 },
    { key: 'UserSignups' as KPIMetric, label: 'User Signups', value: 1240, change: 12.6 },
    { key: 'Runway' as KPIMetric, label: 'Runway (Days)', value: 48, change: -20 },
    { key: 'BurnRate' as KPIMetric, label: 'Burn Rate', value: 6200, change: 18.4 },
    { key: 'CashOnHand' as KPIMetric, label: 'Cash on Hand', value: 45600, change: -9.2 }
  ];

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @media (max-width: 768px) {
          .kpi-dashboard {
            flex-direction: column !important;
          }
          .kpi-sidebar {
            width: 100% !important;
            height: auto !important;
          }
          .kpi-main {
            flex: none !important;
            height: auto !important;
          }
          .kpi-chat {
            width: 100% !important;
            height: 400px !important;
            margin: 16px !important;
          }
          .kpi-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            padding: 16px !important;
          }
        }
        @media (max-width: 1024px) {
          .kpi-grid {
            grid-template-columns: 1fr !important;
          }
          .kpi-chat {
            width: 280px !important;
          }
        }
      `}</style>
      <div className="kpi-dashboard" style={{
        display: 'flex',
        minHeight: '100vh',
        maxHeight: '100vh',
        background: '#1a1a1a',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden'
      }}>
      {/* Left Sidebar */}
      <div className="kpi-sidebar"
        style={{
          width: isSidebarOpen ? '240px' : '60px',
          background: 'rgba(18, 18, 18, 0.8)',
          backdropFilter: 'blur(20px)',
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          minWidth: '60px',
          flexShrink: 0
        }}
      >
        {/* Toggle Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '0 12px',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              background: '#2a2a2c',
              border: '1px solid #3a3a3c',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3a3a3c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2a2a2c';
            }}
          >
            <div style={{
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: isSidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}>
              <div style={{
                width: '0',
                height: '0',
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderLeft: '6px solid #ffffff'
              }} />
            </div>
          </button>
        </div>

        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 20px',
          marginBottom: '24px',
          justifyContent: isSidebarOpen ? 'flex-start' : 'center'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: '#ffffff',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: '600',
            color: '#000000'
          }}>📊</div>
          {isSidebarOpen && (
            <span style={{ fontSize: '12px', fontWeight: '400', color: '#ffffff' }}>Dashboard</span>
          )}
        </div>

        {/* Navigation */}
        <div style={{ 
          padding: isSidebarOpen ? '0 24px' : '0 12px',
          opacity: isSidebarOpen ? 1 : 0.8
        }}>
          {/* Dashboard Section */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarOpen ? 'space-between' : 'center',
              padding: '8px 12px',
              background: '#2a2a2c',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: '#ef4444',
                  borderRadius: '2px'
                }} />
                {isSidebarOpen && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '400',
                    color: '#ffffff'
                  }}>Dashboard</span>
                )}
              </div>
              {isSidebarOpen && (
                <div style={{
                  width: '0',
                  height: '0',
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '6px solid #9ca3af',
                  transform: 'rotate(180deg)'
                }} />
              )}
            </div>
            
            {/* Dashboard Sub-items */}
            {isSidebarOpen && (
              <div style={{ paddingLeft: '16px', marginBottom: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                fontSize: '12px',
                fontWeight: '400',
                color: '#ffffff',
                cursor: 'pointer'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ef4444'
                }} />
                Business
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                fontSize: '12px',
                fontWeight: '400',
                color: '#9ca3af',
                cursor: 'pointer'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#6b7280'
                }} />
                Personal
              </div>
            </div>
            )}
          </div>

          {/* Strategy Section */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarOpen ? 'space-between' : 'center',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '400',
              color: '#9ca3af',
              cursor: 'pointer',
              marginBottom: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: 'transparent',
                  border: '2px solid #9ca3af',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: '#9ca3af',
                    borderRadius: '50%'
                  }} />
                </div>
                {isSidebarOpen && <span>Strategy</span>}
              </div>
              {isSidebarOpen && (
                <div style={{
                  width: '0',
                  height: '0',
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '6px solid #9ca3af'
                }} />
              )}
            </div>
          </div>

          {/* Other Navigation Items */}
          <div style={{ marginTop: '16px' }}>
            {[
              { name: 'Tasks', icon: '✅', href: '/tasks' },
              { name: 'Calendar', icon: '📅', href: '/calendar' },
              { name: 'CSV Upload', icon: '📊', href: '/csv-upload' },
              { name: 'Personal', icon: '👤', href: '/personal' },
              { name: 'Strategy', icon: '🎯', href: '/strategy' },
              { name: 'Account', icon: '⚙️', href: '/account' },
              { name: 'Settings', icon: '🔧', href: '/settings' }
            ].map((item) => (
              <a key={item.name} href={item.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '400',
                color: '#9ca3af',
                cursor: 'pointer',
                marginBottom: '2px',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
              }}>
                <span style={{ fontSize: '14px' }}>{item.icon}</span>
                {isSidebarOpen && item.name}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ 
          marginTop: 'auto', 
          padding: isSidebarOpen ? '0 20px' : '0 12px' 
        }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '400',
            width: '100%',
            cursor: 'pointer',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center'
          }}>
            <div style={{ fontSize: '12px' }}>+</div>
            {isSidebarOpen && <span>New Project</span>}
          </button>
        </div>
      </div>

       {/* Main Content */}
       <div className="kpi-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* KPI Grid */}
        <div className="kpi-grid" style={{
          flex: 1,
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          overflow: 'auto',
          background: '#1a1a1a',
          minHeight: 0
        }}>
          {metrics.map((metric) => {
            const trend = trends[metric.key];
            const statusColor = getStatusColor(metric.key, metric.change);
            
            return (
              <div key={metric.key} style={{
                background: 'rgba(32, 32, 32, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{
                      fontSize: '12px',
                      fontWeight: '400',
                      color: '#ffffff',
                      margin: 0
                    }}>{metric.label}</h3>
                    {getStatusIcon(metric.key, metric.change)}
                  </div>
                  
                  {/* Dropdown and Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {metric.key !== 'Runway' && (
                      <select style={{
                        background: 'rgba(42, 42, 42, 0.6)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#9ca3af',
                        fontSize: '10px',
                        padding: '2px 6px',
                        outline: 'none',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}>
                        <option value="6M">6M</option>
                        <option value="1Y">1Y</option>
                        <option value="1W">1W</option>
                      </select>
                    )}
                    <button style={{
                      background: 'rgba(42, 42, 42, 0.4)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                      color: '#9ca3af',
                      fontSize: '10px',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>Edit</button>
                    <button style={{
                      background: 'rgba(42, 42, 42, 0.4)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                      color: '#9ca3af',
                      fontSize: '10px',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>Info</button>
                  </div>
                </div>

                {/* Date Information */}
                <div style={{
                  fontSize: '10px',
                  fontWeight: '400',
                  color: '#6b7280'
                }}>
                  From: 13/05/2025
                </div>

                {/* Value */}
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#ffffff',
                  lineHeight: '1'
                }}>{formatValue(metric.value, metric.key)}</div>

                {/* Change and Status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '400',
                    color: metric.change > 0 ? '#10b981' : '#ef4444'
                  }}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: statusColor
                  }} />
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '400',
                    color: statusColor
                  }}>{getStatusText(metric.key, metric.change)}</span>
                </div>

                {/* Chart */}
                <div style={{
                  height: '80px',
                  background: 'rgba(26, 26, 26, 0.3)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '8px',
                  padding: '8px',
                  marginTop: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {renderChart(metric.key, trend)}
                </div>
                
                {/* Glassy overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)'
                }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Sidebar - AI Chat */}
      <div className="kpi-chat" style={{
        width: '320px',
        background: 'rgba(32, 32, 32, 0.4)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        margin: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        maxHeight: 'calc(100vh - 48px)'
      }}>
        {/* AI Chat Header */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #2a2a2a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: '#ef4444',
              borderRadius: '2px'
            }} />
            <h3 style={{
              fontSize: '12px',
              fontWeight: '400',
              color: '#ffffff',
              margin: 0
            }}>AI Assistant Chat</h3>
          </div>
          <button style={{
            padding: '4px 8px',
            background: 'transparent',
            border: '1px solid #6b7280',
            borderRadius: '4px',
            color: '#9ca3af',
            fontSize: '10px',
            fontWeight: '400',
            cursor: 'pointer'
          }}>Move to Main Chat</button>
        </div>

        {/* Chat Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Chat Messages Area */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {chatMessages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {message.role === 'assistant' && (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    🤖
                  </div>
                )}
                
                <div style={{
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: message.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: message.role === 'user' 
                    ? 'rgba(239, 68, 68, 0.8)'
                    : 'rgba(42, 42, 42, 0.8)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  fontSize: '11px',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap'
                }}>
                  {message.content.split(/\*\*(.+?)\*\*/).map((part, i) => 
                    i % 2 === 0 ? part : <strong key={i} style={{ fontWeight: '600' }}>{part}</strong>
                  )}
                </div>

                {message.role === 'user' && (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    👤
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  🤖
                </div>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '12px 12px 12px 4px',
                  background: 'rgba(42, 42, 42, 0.8)',
                  color: '#9ca3af',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  fontSize: '11px'
                }}>
                  AI is thinking...
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          <div>
            <div style={{
              fontSize: '9px',
              fontWeight: '400',
              color: '#6b7280',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Ask about your Business Metrics:</div>
            <ul style={{
              fontSize: '11px',
              fontWeight: '400',
              color: '#9ca3af',
              paddingLeft: '12px',
              margin: 0,
              lineHeight: '1.4'
            }}>
              <li style={{ marginBottom: '3px', cursor: 'pointer' }} 
                  onClick={() => setChatInput('CAC is not updated all time')}>
                • CAC is not updated all time
              </li>
              <li style={{ marginBottom: '3px', cursor: 'pointer' }} 
                  onClick={() => setChatInput('Your Net Profit increased by 12.5%')}>
                • Your Net Profit increased by 12.5%
              </li>
              <li style={{ marginBottom: '3px', cursor: 'pointer' }} 
                  onClick={() => setChatInput('Your Burn Rate grew up by 18.4%')}>
                • Your Burn Rate grew up by 18.4%
              </li>
            </ul>
          </div>

          {/* Action Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div 
              style={{
                background: 'rgba(42, 42, 42, 0.6)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setChatInput('Business metrics analysis')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(42, 42, 42, 0.8)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(42, 42, 42, 0.6)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: '600',
                color: '#000000'
              }}>📊</div>
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '400',
                  color: '#ffffff',
                  marginBottom: '2px'
                }}>Business metrics</div>
                <div style={{
                  fontSize: '9px',
                  fontWeight: '400',
                  color: '#9ca3af'
                }}>Lorem ipsum dolor sit amet</div>
              </div>
            </div>

            <div 
              style={{
                background: 'rgba(42, 42, 42, 0.6)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setChatInput('Product performance analysis')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(42, 42, 42, 0.8)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(42, 42, 42, 0.6)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: '600',
                color: '#000000'
              }}>📈</div>
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '400',
                  color: '#ffffff',
                  marginBottom: '2px'
                }}>Product performance</div>
                <div style={{
                  fontSize: '9px',
                  fontWeight: '400',
                  color: '#9ca3af'
                }}>Lorem ipsum dolor sit amet</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #2a2a2a'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Ask anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(42, 42, 42, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '400',
                outline: 'none',
                opacity: isTyping ? 0.6 : 1,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
            />
            <button 
              onClick={() => {
                console.log('Send button clicked');
                console.log('Button disabled?', isTyping || !chatInput.trim());
                console.log('isTyping:', isTyping);
                console.log('chatInput.trim():', chatInput.trim());
                handleSendMessage();
              }}
              disabled={isTyping || !chatInput.trim()}
              style={{
                padding: '8px',
                background: isTyping || !chatInput.trim() ? 'rgba(58, 58, 58, 0.6)' : 'rgba(107, 114, 128, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '400',
                cursor: isTyping || !chatInput.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
            >
              ✈️
            </button>
            {/* Test button for debugging */}
            <button
              onClick={() => {
                console.log('Test button clicked');
                setChatMessages(prev => [...prev, {
                  role: 'user',
                  content: 'Test message'
                }, {
                  role: 'assistant', 
                  content: 'Test response received!'
                }]);
              }}
              style={{
                padding: '8px',
                background: 'rgba(16, 185, 129, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '10px',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
            >
              Test
            </button>
          </div>
        </div>
        
        {/* Glassy overlay for AI chat panel */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)'
        }} />
      </div>
      </div>
    </>
  );
}