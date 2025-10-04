export interface KPI {
  id: string;
  userId: string;
  metricName: KPIMetric;
  source: DataSource;
  value: number;
  timestamp: Date;
  lastSyncedAt: Date;
  isManualOverride: boolean;
  overrideValue?: number;
  overrideTimestamp?: Date;
  status: SyncStatus;
  errorMessage?: string;
}

export type KPIMetric = 
  | 'MRR' 
  | 'NetProfit'
  | 'BurnRate'
  | 'CashOnHand'
  | 'UserSignups'
  | 'Runway'
  | 'CAC' 
  | 'ChurnRate'
  | 'ActiveUsers'
  | 'ConversionRate'
  | 'LTV' 
  | 'DAU' 
  | 'WAU' 
  | 'WebsiteTraffic' 
  | 'LeadConversionRate'
  | 'TasksCompleted';

export type DataSource = 'Stripe' | 'GoogleAnalytics' | 'Airtable' | 'GoogleSheets' | 'Manual' | 'CSV' | 'Notion';

export type SyncStatus = 'active' | 'error' | 'pending' | 'disabled';

export interface DataSourceConfig {
  id: string;
  userId: string;
  source: DataSource;
  isActive: boolean;
  credentials: EncryptedCredentials;
  syncFrequency: SyncFrequency;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EncryptedCredentials {
  encryptedData: string;
  iv: string;
}

export type SyncFrequency = 'hourly' | 'daily' | 'weekly' | 'manual';

export interface KPISyncJob {
  id: string;
  userId: string;
  sourceId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metricsSynced: number;
}

export interface KPITrend {
  metricName: KPIMetric;
  values: Array<{
    value: number;
    timestamp: Date;
  }>;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export interface KPIInsight {
  id: string;
  userId: string;
  metricName: KPIMetric;
  insight: string;
  severity: 'info' | 'warning' | 'critical';
  generatedAt: Date;
  isRead: boolean;
}

// Core KPIs (shown by default)
export const CORE_KPI_METRICS: KPIMetric[] = [
  'MRR',
  'NetProfit', 
  'BurnRate',
  'CashOnHand',
  'UserSignups',
  'Runway'
];

// Customizable KPIs (hidden by default)
export const CUSTOMIZABLE_KPI_METRICS: KPIMetric[] = [
  'CAC',
  'ChurnRate',
  'ActiveUsers',
  'ConversionRate'
];

export const KPI_METRICS: Record<KPIMetric, { 
  label: string; 
  unit: string; 
  description: string;
  chartType: 'line' | 'bar' | 'area' | 'combo' | 'sparkline' | 'donut' | 'funnel' | 'horizontalBar';
  isCore: boolean;
  goal?: number;
}> = {
  // Core KPIs
  MRR: { 
    label: 'Monthly Recurring Revenue', 
    unit: '$', 
    description: 'Total monthly recurring revenue',
    chartType: 'line',
    isCore: true,
    goal: 50000
  },
  NetProfit: { 
    label: 'Net Profit', 
    unit: '$', 
    description: 'Monthly net profit/loss',
    chartType: 'bar',
    isCore: true,
    goal: 10000
  },
  BurnRate: { 
    label: 'Burn Rate', 
    unit: '$/month', 
    description: 'Monthly cash burn rate',
    chartType: 'combo',
    isCore: true,
    goal: 5000
  },  
  CashOnHand: { 
    label: 'Cash on Hand', 
    unit: '$', 
    description: 'Current available cash',
    chartType: 'sparkline',
    isCore: true,
    goal: 100000
  },
  UserSignups: { 
    label: 'User Signups', 
    unit: 'users', 
    description: 'New user registrations',
    chartType: 'area',
    isCore: true,
    goal: 1000
  },
  Runway: { 
    label: 'Runway (Days)', 
    unit: 'days', 
    description: 'Estimated days until cash runs out',
    chartType: 'horizontalBar',
    isCore: true,
    goal: 365
  },
  
  // Customizable KPIs
  CAC: { 
    label: 'Customer Acquisition Cost', 
    unit: '$', 
    description: 'Cost to acquire a new customer',
    chartType: 'bar',
    isCore: false,
    goal: 100
  },
  ChurnRate: { 
    label: 'Churn Rate', 
    unit: '%', 
    description: 'Percentage of customers who cancel',
    chartType: 'donut',
    isCore: false,
    goal: 2
  },
  ActiveUsers: { 
    label: 'Active Users', 
    unit: 'users', 
    description: 'Daily/Weekly active users',
    chartType: 'line',
    isCore: false,
    goal: 5000
  },
  ConversionRate: { 
    label: 'Conversion Rate', 
    unit: '%', 
    description: 'Lead to customer conversion rate',
    chartType: 'funnel',
    isCore: false,
    goal: 5
  },
  
  // Legacy metrics (keeping for backward compatibility)
  LTV: { 
    label: 'Lifetime Value', 
    unit: '$', 
    description: 'Total value of a customer over time',
    chartType: 'line',
    isCore: false,
    goal: 2400
  },
  DAU: { 
    label: 'Daily Active Users', 
    unit: 'users', 
    description: 'Number of daily active users',
    chartType: 'line',
    isCore: false,
    goal: 1000
  },
  WAU: { 
    label: 'Weekly Active Users', 
    unit: 'users', 
    description: 'Number of weekly active users',
    chartType: 'line',
    isCore: false,
    goal: 5000
  },
  WebsiteTraffic: { 
    label: 'Website Traffic', 
    unit: 'visitors', 
    description: 'Number of website visitors',
    chartType: 'line',
    isCore: false,
    goal: 20000
  },
  LeadConversionRate: { 
    label: 'Lead Conversion Rate', 
    unit: '%', 
    description: 'Percentage of leads converted',
    chartType: 'line',
    isCore: false,
    goal: 2
  },
  TasksCompleted: {
    label: 'Tasks Completed',
    unit: 'tasks',
    description: 'Number of tasks completed this week (from Notion)',
    chartType: 'bar',
    isCore: false,
    goal: 10
  }
};

export const DATA_SOURCES: Record<DataSource, { label: string; description: string; authType: 'oauth' | 'api_key' }> = {
  Stripe: { label: 'Stripe', description: 'Payment processing and subscription data', authType: 'api_key' },
  GoogleAnalytics: { label: 'Google Analytics 4', description: 'Website traffic and user behavior', authType: 'oauth' },
  Airtable: { label: 'Airtable', description: 'Custom data and metrics', authType: 'api_key' },
  GoogleSheets: { label: 'Google Sheets', description: 'Manual data entry and calculations', authType: 'oauth' },
  Manual: { label: 'Manual Entry', description: 'Direct input of KPI values', authType: 'api_key' },
  CSV: { label: 'CSV Upload', description: 'Bulk data import from CSV files', authType: 'api_key' },
  Notion: { label: 'Notion', description: 'Data from Notion pages and databases', authType: 'api_key' }
}; 