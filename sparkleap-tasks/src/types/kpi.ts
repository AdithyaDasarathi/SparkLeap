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
  | 'ChurnRate' 
  | 'CAC' 
  | 'LTV' 
  | 'DAU' 
  | 'WAU' 
  | 'WebsiteTraffic' 
  | 'LeadConversionRate' 
  | 'BurnRate';

export type DataSource = 'Stripe' | 'GoogleAnalytics' | 'Airtable' | 'GoogleSheets' | 'Manual' | 'CSV';

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

export const KPI_METRICS: Record<KPIMetric, { label: string; unit: string; description: string }> = {
  MRR: { label: 'Monthly Recurring Revenue', unit: '$', description: 'Total monthly recurring revenue' },
  ChurnRate: { label: 'Churn Rate', unit: '%', description: 'Percentage of customers who cancel' },
  CAC: { label: 'Customer Acquisition Cost', unit: '$', description: 'Cost to acquire a new customer' },
  LTV: { label: 'Lifetime Value', unit: '$', description: 'Total value of a customer over time' },
  DAU: { label: 'Daily Active Users', unit: 'users', description: 'Number of daily active users' },
  WAU: { label: 'Weekly Active Users', unit: 'users', description: 'Number of weekly active users' },
  WebsiteTraffic: { label: 'Website Traffic', unit: 'visitors', description: 'Number of website visitors' },
  LeadConversionRate: { label: 'Lead Conversion Rate', unit: '%', description: 'Percentage of leads converted' },
  BurnRate: { label: 'Burn Rate', unit: '$/month', description: 'Monthly cash burn rate' }
};

export const DATA_SOURCES: Record<DataSource, { label: string; description: string; authType: 'oauth' | 'api_key' }> = {
  Stripe: { label: 'Stripe', description: 'Payment processing and subscription data', authType: 'api_key' },
  GoogleAnalytics: { label: 'Google Analytics 4', description: 'Website traffic and user behavior', authType: 'oauth' },
  Airtable: { label: 'Airtable', description: 'Custom data and metrics', authType: 'api_key' },
  GoogleSheets: { label: 'Google Sheets', description: 'Manual data entry and calculations', authType: 'oauth' },
  Manual: { label: 'Manual Entry', description: 'Direct input of KPI values', authType: 'api_key' },
  CSV: { label: 'CSV Upload', description: 'Bulk data import from CSV files', authType: 'api_key' }
}; 