import crypto from 'crypto';
import { KPI, DataSourceConfig, KPISyncJob, KPIInsight } from '../types/kpi';

// In-memory storage for MVP (replace with actual database in production)
const kpiStore: Map<string, KPI> = new Map();
const dataSourceStore: Map<string, DataSourceConfig> = new Map();
const syncJobStore: Map<string, KPISyncJob> = new Map();
const insightStore: Map<string, KPIInsight> = new Map();

// Encryption key (use environment variable in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!';

export class DatabaseService {
  // KPI Operations
  static async createKPI(kpi: Omit<KPI, 'id'>): Promise<KPI> {
    const id = crypto.randomUUID();
    const newKPI: KPI = { ...kpi, id };
    kpiStore.set(id, newKPI);
    return newKPI;
  }

  static async getKPI(id: string): Promise<KPI | null> {
    return kpiStore.get(id) || null;
  }

  static async getKPIsByUser(userId: string): Promise<KPI[]> {
    return Array.from(kpiStore.values()).filter(kpi => kpi.userId === userId);
  }

  static async updateKPI(id: string, updates: Partial<KPI>): Promise<KPI | null> {
    const kpi = kpiStore.get(id);
    if (!kpi) return null;
    
    const updatedKPI = { ...kpi, ...updates };
    kpiStore.set(id, updatedKPI);
    return updatedKPI;
  }

  static async deleteKPI(id: string): Promise<boolean> {
    return kpiStore.delete(id);
  }

  // Data Source Operations
  static async createDataSource(config: Omit<DataSourceConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataSourceConfig> {
    const id = crypto.randomUUID();
    const now = new Date();
    const newConfig: DataSourceConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now
    };
    dataSourceStore.set(id, newConfig);
    return newConfig;
  }

  static async getDataSource(id: string): Promise<DataSourceConfig | null> {
    return dataSourceStore.get(id) || null;
  }

  static async getDataSourcesByUser(userId: string): Promise<DataSourceConfig[]> {
    return Array.from(dataSourceStore.values()).filter(config => config.userId === userId);
  }

  static async updateDataSource(id: string, updates: Partial<DataSourceConfig>): Promise<DataSourceConfig | null> {
    const config = dataSourceStore.get(id);
    if (!config) return null;
    
    const updatedConfig = { ...config, ...updates, updatedAt: new Date() };
    dataSourceStore.set(id, updatedConfig);
    return updatedConfig;
  }

  static async deleteDataSource(id: string): Promise<boolean> {
    return dataSourceStore.delete(id);
  }

  // Sync Job Operations
  static async createSyncJob(job: Omit<KPISyncJob, 'id'>): Promise<KPISyncJob> {
    const id = crypto.randomUUID();
    const newJob: KPISyncJob = { ...job, id };
    syncJobStore.set(id, newJob);
    return newJob;
  }

  static async getSyncJob(id: string): Promise<KPISyncJob | null> {
    return syncJobStore.get(id) || null;
  }

  static async getSyncJobsByUser(userId: string, limit = 50): Promise<KPISyncJob[]> {
    return Array.from(syncJobStore.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  static async updateSyncJob(id: string, updates: Partial<KPISyncJob>): Promise<KPISyncJob | null> {
    const job = syncJobStore.get(id);
    if (!job) return null;
    
    const updatedJob = { ...job, ...updates };
    syncJobStore.set(id, updatedJob);
    return updatedJob;
  }

  // Insight Operations
  static async createInsight(insight: Omit<KPIInsight, 'id'>): Promise<KPIInsight> {
    const id = crypto.randomUUID();
    const newInsight: KPIInsight = { ...insight, id };
    insightStore.set(id, newInsight);
    return newInsight;
  }

  static async getInsightsByUser(userId: string): Promise<KPIInsight[]> {
    return Array.from(insightStore.values())
      .filter(insight => insight.userId === userId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  static async markInsightAsRead(id: string): Promise<KPIInsight | null> {
    const insight = insightStore.get(id);
    if (!insight) return null;
    
    const updatedInsight = { ...insight, isRead: true };
    insightStore.set(id, updatedInsight);
    return updatedInsight;
  }

  // Encryption utilities
  static encryptCredentials(data: string): { encryptedData: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encryptedData: encrypted, iv: iv.toString('hex') };
  }

  static decryptCredentials(encryptedData: string, iv: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Analytics and reporting
  static async getKPITrends(userId: string, metricName: string, days: number = 30): Promise<any[]> {
    const kpis = await this.getKPIsByUser(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return kpis
      .filter(kpi => kpi.metricName === metricName && kpi.timestamp >= cutoffDate)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(kpi => ({
        value: kpi.isManualOverride ? kpi.overrideValue! : kpi.value,
        timestamp: kpi.timestamp
      }));
  }

  static async getSyncStatus(userId: string): Promise<{ active: number; error: number; pending: number }> {
    const dataSources = await this.getDataSourcesByUser(userId);
    const status = { active: 0, error: 0, pending: 0 };
    
    dataSources.forEach(source => {
      if (source.isActive) {
        // Check last sync time to determine status
        if (source.lastSyncAt) {
          const hoursSinceLastSync = (Date.now() - source.lastSyncAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastSync > 24) {
            status.error++;
          } else {
            status.active++;
          }
        } else {
          status.pending++;
        }
      }
    });
    
    return status;
  }

  // Seed sample data for all KPI metrics
  static async seedSampleData(userId: string): Promise<void> {
    const now = new Date();
    const metrics = [
      'MRR', 'NetProfit', 'BurnRate', 'CashOnHand', 'UserSignups', 'Runway',
      'CAC', 'ChurnRate', 'ActiveUsers', 'ConversionRate'
    ];

    // Generate 30 days of sample data
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      
      // Generate realistic sample data for each metric
      const sampleData = {
        MRR: 25000 + i * 500 + Math.sin(i / 5) * 1000,
        NetProfit: 5000 + i * 200 + Math.cos(i / 7) * 1500,
        BurnRate: 8000 + i * 100 + Math.sin(i / 6) * 500,
        CashOnHand: 150000 - i * 2000 + Math.cos(i / 4) * 5000,
        UserSignups: 50 + i * 3 + Math.sin(i / 3) * 10,
        Runway: 365 - i * 2 + Math.cos(i / 8) * 10,
        CAC: 120 + Math.sin(i / 5) * 20,
        ChurnRate: 2.5 + Math.sin(i / 7) * 1.5,
        ActiveUsers: 2000 + i * 50 + Math.cos(i / 4) * 200,
        ConversionRate: 3.2 + Math.sin(i / 6) * 1.0
      };

      for (const metric of metrics) {
        const value = sampleData[metric as keyof typeof sampleData];
        await this.createKPI({
          userId,
          metricName: metric as any,
          source: 'Manual',
          value: Math.max(0, value), // Ensure non-negative values
          timestamp: date,
          lastSyncedAt: date,
          isManualOverride: false,
          status: 'active'
        });
      }
    }
  }
} 