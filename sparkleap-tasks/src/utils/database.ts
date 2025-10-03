import { KPI, KPIMetric, DataSourceConfig, KPISyncJob, KPIInsight } from '../types/kpi';
import { Task } from '../types/task';
import {
  NotionDatabaseRecord,
  NotionTaskRecord,
  NotionUserRecord,
  ExecutionSnapshotRecord
} from '../types/notion';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Simple file-based storage for persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_SOURCES_FILE = path.join(DATA_DIR, 'datasources.json');
const KPIS_FILE = path.join(DATA_DIR, 'kpis.json');
const SYNC_JOBS_FILE = path.join(DATA_DIR, 'syncjobs.json');
const INSIGHTS_FILE = path.join(DATA_DIR, 'insights.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const NOTION_DATABASES_FILE = path.join(DATA_DIR, 'notion_databases.json');
const NOTION_TASKS_FILE = path.join(DATA_DIR, 'notion_tasks.json');
const NOTION_USERS_FILE = path.join(DATA_DIR, 'notion_users.json');
const EXECUTION_SNAPSHOTS_FILE = path.join(DATA_DIR, 'execution_snapshots.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
const initializeFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}));
  }
};

initializeFile(DATA_SOURCES_FILE);
initializeFile(KPIS_FILE);
initializeFile(SYNC_JOBS_FILE);
initializeFile(INSIGHTS_FILE);
initializeFile(TASKS_FILE);
initializeFile(NOTION_DATABASES_FILE);
initializeFile(NOTION_TASKS_FILE);
initializeFile(NOTION_USERS_FILE);
initializeFile(EXECUTION_SNAPSHOTS_FILE);

// File-based storage functions
const readData = (filePath: string) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return {};
  }
};

const writeData = (filePath: string, data: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
};

// In-memory stores with file persistence
const kpiStore = new Map<string, KPI>();
const dataSourceStore = new Map<string, DataSourceConfig>();
const syncJobStore = new Map<string, KPISyncJob>();
const insightStore = new Map<string, KPIInsight>();
const notionDatabaseStore = new Map<string, NotionDatabaseRecord>();
const notionTaskStore = new Map<string, NotionTaskRecord>();
const notionUserStore = new Map<string, NotionUserRecord>();
const executionSnapshotStore = new Map<string, ExecutionSnapshotRecord>();

// Load data from files on startup
const loadDataFromFiles = () => {
  try {
    const kpis = readData(KPIS_FILE);
    Object.entries(kpis).forEach(([id, kpi]) => {
      kpiStore.set(id, kpi as KPI);
    });

    const dataSources = readData(DATA_SOURCES_FILE);
    Object.entries(dataSources).forEach(([id, ds]) => {
      dataSourceStore.set(id, ds as DataSourceConfig);
    });

    const syncJobs = readData(SYNC_JOBS_FILE);
    Object.entries(syncJobs).forEach(([id, job]) => {
      syncJobStore.set(id, job as KPISyncJob);
    });

    const insights = readData(INSIGHTS_FILE);
    Object.entries(insights).forEach(([id, insight]) => {
      insightStore.set(id, insight as KPIInsight);
    });

    const notionDatabases = readData(NOTION_DATABASES_FILE);
    Object.entries(notionDatabases).forEach(([id, rec]) => {
      notionDatabaseStore.set(id, rec as NotionDatabaseRecord);
    });

    const notionTasks = readData(NOTION_TASKS_FILE);
    Object.entries(notionTasks).forEach(([id, rec]) => {
      notionTaskStore.set(id, rec as NotionTaskRecord);
    });

    const notionUsers = readData(NOTION_USERS_FILE);
    Object.entries(notionUsers).forEach(([id, rec]) => {
      notionUserStore.set(id, rec as NotionUserRecord);
    });

    const executionSnapshots = readData(EXECUTION_SNAPSHOTS_FILE);
    Object.entries(executionSnapshots).forEach(([id, rec]) => {
      executionSnapshotStore.set(id, rec as ExecutionSnapshotRecord);
    });

    console.log(`📊 Loaded data from files: ${Object.keys(kpis).length} KPIs, ${Object.keys(dataSources).length} data sources`);
    
    // Debug: Show sources in loaded data
    const sources = new Set(Array.from(kpiStore.values()).map(kpi => kpi.source));
    console.log(`📊 Sources found in KPIs:`, Array.from(sources));
  } catch (error) {
    console.error('Error loading data from files:', error);
  }
};

// Save data to files
const saveDataToFiles = () => {
  try {
    const kpis = Object.fromEntries(kpiStore);
    writeData(KPIS_FILE, kpis);

    const dataSources = Object.fromEntries(dataSourceStore);
    writeData(DATA_SOURCES_FILE, dataSources);

    const syncJobs = Object.fromEntries(syncJobStore);
    writeData(SYNC_JOBS_FILE, syncJobs);

    const insights = Object.fromEntries(insightStore);
    writeData(INSIGHTS_FILE, insights);

    const notionDatabases = Object.fromEntries(notionDatabaseStore);
    writeData(NOTION_DATABASES_FILE, notionDatabases);

    const notionTasks = Object.fromEntries(notionTaskStore);
    writeData(NOTION_TASKS_FILE, notionTasks);

    const notionUsers = Object.fromEntries(notionUserStore);
    writeData(NOTION_USERS_FILE, notionUsers);

    const executionSnapshots = Object.fromEntries(executionSnapshotStore);
    writeData(EXECUTION_SNAPSHOTS_FILE, executionSnapshots);
  } catch (error) {
    console.error('Error saving data to files:', error);
  }
};

// Load data on startup
loadDataFromFiles();

// Save data periodically and on process exit
setInterval(saveDataToFiles, 5000); // Save every 5 seconds
process.on('beforeExit', saveDataToFiles);

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-here';

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
    // First, try to reload data from file to ensure we have the latest
    try {
      const fileData = readData(KPIS_FILE);
      const fileKpis = Object.values(fileData);
      console.log(`📁 File contains ${fileKpis.length} KPIs`);
      
      // Check if we need to reload the store
      const storeKpis = Array.from(kpiStore.values());
      if (fileKpis.length !== storeKpis.length) {
        console.log(`🔄 Reloading KPI store: file has ${fileKpis.length}, store has ${storeKpis.length}`);
        kpiStore.clear();
        Object.entries(fileData).forEach(([id, kpi]) => {
          kpiStore.set(id, kpi as KPI);
        });
      }
    } catch (error) {
      console.error('Error reloading KPIs from file:', error);
    }
    
    const allKpis = Array.from(kpiStore.values());
    const userKpis = allKpis.filter(kpi => kpi.userId === userId);
    
    // Debug: Show what's in the store
    const sources = new Set(allKpis.map(kpi => kpi.source));
    console.log(`🔍 getKPIsByUser(${userId}): ${userKpis.length} KPIs found out of ${allKpis.length} total`);
    console.log(`🔍 Sources in store: ${Array.from(sources).join(', ')}`);
    
    // Show breakdown by source for this user
    const bySource: Record<string, number> = {};
    userKpis.forEach(kpi => {
      if (!bySource[kpi.source]) bySource[kpi.source] = 0;
      bySource[kpi.source]++;
    });
    console.log(`🔍 User KPIs by source:`, bySource);
    
    return userKpis;
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
    
    console.log('💾 Creating data source:', {
      id: newConfig.id,
      source: newConfig.source,
      userId: newConfig.userId,
      isActive: newConfig.isActive
    });
    
    dataSourceStore.set(id, newConfig);
    
    // Save immediately to file
    const dataSources = Object.fromEntries(dataSourceStore);
    writeData(DATA_SOURCES_FILE, dataSources);
    
    // Verify it was saved
    const saved = dataSourceStore.get(id);
    if (!saved) {
      throw new Error('Failed to save data source');
    }
    
    console.log('✅ Data source created and saved successfully');
    return newConfig;
  }

  static async getDataSource(id: string): Promise<DataSourceConfig | null> {
    let dataSource = dataSourceStore.get(id);
    console.log(`🔍 Looking for data source ${id}:`, dataSource ? 'Found' : 'Not found');
    
    // If not found in memory, try loading from file
    if (!dataSource) {
      console.log('🔄 Reloading data sources from file...');
      try {
        const fileData = readData(DATA_SOURCES_FILE);
        // Clear the existing store and reload from file
        dataSourceStore.clear();
        Object.entries(fileData).forEach(([fileId, ds]) => {
          dataSourceStore.set(fileId, ds as DataSourceConfig);
        });
        
        dataSource = dataSourceStore.get(id);
        console.log(`🔍 After reload, data source ${id}:`, dataSource ? 'Found' : 'Not found');
        
        // If still not found, wait a moment and try once more
        if (!dataSource) {
          console.log('⏱️ Waiting and trying one more time...');
          await new Promise(resolve => setTimeout(resolve, 500));
          const fileDataRetry = readData(DATA_SOURCES_FILE);
          Object.entries(fileDataRetry).forEach(([fileId, ds]) => {
            dataSourceStore.set(fileId, ds as DataSourceConfig);
          });
          dataSource = dataSourceStore.get(id);
          console.log(`🔍 Final attempt, data source ${id}:`, dataSource ? 'Found' : 'Not found');
        }
      } catch (error) {
        console.error('Error reloading data sources:', error);
      }
    }
    
    return dataSource || null;
  }

  static async getDataSourcesByUser(userId: string): Promise<DataSourceConfig[]> {
    const dataSources = Array.from(dataSourceStore.values()).filter(config => config.userId === userId);
    console.log(`📋 Found ${dataSources.length} data sources for user ${userId}`);
    dataSources.forEach(ds => {
      console.log(`   - ${ds.id}: ${ds.source} (${ds.isActive ? 'active' : 'inactive'})`);
    });
    return dataSources;
  }

  static async updateDataSource(id: string, updates: Partial<DataSourceConfig>): Promise<DataSourceConfig | null> {
    const config = dataSourceStore.get(id);
    if (!config) return null;
    
    const updatedConfig = { ...config, ...updates, updatedAt: new Date() };
    dataSourceStore.set(id, updatedConfig);
    
    // Save immediately to file
    const dataSources = Object.fromEntries(dataSourceStore);
    writeData(DATA_SOURCES_FILE, dataSources);
    
    return updatedConfig;
  }

  static async deleteDataSource(id: string): Promise<boolean> {
    const deleted = dataSourceStore.delete(id);
    if (deleted) {
      // Save immediately to file
      const dataSources = Object.fromEntries(dataSourceStore);
      writeData(DATA_SOURCES_FILE, dataSources);
    }
    return deleted;
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
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encryptedData: encrypted, iv: iv.toString('hex') };
  }

  static decryptCredentials(encryptedData: string, iv: string): string {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Analytics and reporting
  static async getKPITrends(userId: string, metricName: string, days: number = 30): Promise<any[]> {
    const kpis = await this.getKPIsByUser(userId);
    
    // Filter KPIs for this metric first to reduce memory usage
    const relevantKpis = kpis
      .filter(kpi => kpi.metricName === metricName)
      .sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return aTime - bTime;
      });
    
    // If we have real data (GoogleSheets, etc.), prioritize it over Manual data
    const realDataKpis = relevantKpis.filter(kpi => kpi.source !== 'Manual');
    const manualDataKpis = relevantKpis.filter(kpi => kpi.source === 'Manual');
    
    // Debug: Show breakdown by source (limited to avoid memory issues)
    const sources = new Set(relevantKpis.map(kpi => kpi.source));
    console.log(`📊 getKPITrends for ${metricName}: ${realDataKpis.length} real data points, ${manualDataKpis.length} manual data points`);
    
    // Use real data if available, otherwise fall back to manual data
    let dataToUse = realDataKpis.length > 0 ? realDataKpis : manualDataKpis;
    
    // If we have real data but no trends, use the latest value to create a single data point
    if (realDataKpis.length > 0 && dataToUse.length === 0) {
      console.log(`📊 Real data exists but no trends for this metric, using latest value`);
      const latestKpi = realDataKpis[realDataKpis.length - 1];
      dataToUse = [latestKpi];
    }
    
    // Return only the fields needed for chart rendering
    return dataToUse.map(kpi => ({
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
        if (source.lastSyncAt && typeof source.lastSyncAt.getTime === 'function') {
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

  // Utility method to generate IDs
  static generateId(): string {
    return crypto.randomUUID();
  }

  // Task Management Methods
  static async getTasksByUser(userId: string): Promise<Task[]> {
    try {
      const tasks = readData(TASKS_FILE);
      return Object.values(tasks).filter((task: any) => task.userId === userId) as Task[];
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  static async createTask(task: Omit<Task, 'id'> & { userId: string }): Promise<Task> {
    try {
      const tasks = readData(TASKS_FILE);
      const newTask: Task = {
        ...task,
        id: this.generateId()
      };
      
      tasks[newTask.id] = newTask;
      writeData(TASKS_FILE, tasks);
      console.log('✅ Task created:', newTask.id);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const tasks = readData(TASKS_FILE);
      const task = tasks[id];
      
      if (!task) {
        throw new Error(`Task ${id} not found`);
      }
      
      const updatedTask = { ...task, ...updates };
      tasks[id] = updatedTask;
      writeData(TASKS_FILE, tasks);
      console.log('✅ Task updated:', id);
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  static async deleteTask(id: string): Promise<void> {
    try {
      const tasks = readData(TASKS_FILE);
      delete tasks[id];
      writeData(TASKS_FILE, tasks);
      console.log('✅ Task deleted:', id);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  static async clearUserTasks(userId: string): Promise<void> {
    try {
      const tasks = readData(TASKS_FILE);
      const filteredTasks: Record<string, Task> = {};
      
      // Keep tasks that don't belong to this user
      Object.entries(tasks).forEach(([id, task]: [string, any]) => {
        if (task.userId !== userId) {
          filteredTasks[id] = task;
        }
      });
      
      writeData(TASKS_FILE, filteredTasks);
      console.log('✅ Cleared tasks for user:', userId);
    } catch (error) {
      console.error('Error clearing user tasks:', error);
      throw error;
    }
  }
} 

// Notion-specific persistence APIs
export class NotionDatabaseService {
  static async upsertDatabase(record: Omit<NotionDatabaseRecord, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }): Promise<NotionDatabaseRecord> {
    const nowIso = new Date().toISOString();
    const existing = notionDatabaseStore.get(record.id);
    const newRecord: NotionDatabaseRecord = {
      ...record,
      createdAt: existing?.createdAt || record.createdAt || nowIso,
      updatedAt: nowIso
    };
    notionDatabaseStore.set(record.id, newRecord);
    const all = Object.fromEntries(notionDatabaseStore);
    writeData(NOTION_DATABASES_FILE, all);
    return newRecord;
  }

  static async getByUser(userId: string): Promise<NotionDatabaseRecord[]> {
    return Array.from(notionDatabaseStore.values()).filter(d => d.userId === userId);
  }

  static async update(id: string, updates: Partial<NotionDatabaseRecord>): Promise<NotionDatabaseRecord | null> {
    const existing = notionDatabaseStore.get(id);
    if (!existing) return null;
    const updated: NotionDatabaseRecord = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    notionDatabaseStore.set(id, updated);
    writeData(NOTION_DATABASES_FILE, Object.fromEntries(notionDatabaseStore));
    return updated;
  }

  static async delete(id: string): Promise<boolean> {
    const deleted = notionDatabaseStore.delete(id);
    if (deleted) writeData(NOTION_DATABASES_FILE, Object.fromEntries(notionDatabaseStore));
    return deleted;
  }
}

export class NotionTaskService {
  static async upsert(task: NotionTaskRecord): Promise<NotionTaskRecord> {
    notionTaskStore.set(task.pageId, task);
    writeData(NOTION_TASKS_FILE, Object.fromEntries(notionTaskStore));
    return task;
  }

  static async upsertMany(tasks: NotionTaskRecord[]): Promise<number> {
    for (const t of tasks) {
      notionTaskStore.set(t.pageId, t);
    }
    writeData(NOTION_TASKS_FILE, Object.fromEntries(notionTaskStore));
    return tasks.length;
  }

  static async getByDatabase(databaseId: string): Promise<NotionTaskRecord[]> {
    return Array.from(notionTaskStore.values()).filter(t => t.databaseId === databaseId);
  }

  static async getByUser(userId: string): Promise<NotionTaskRecord[]> {
    return Array.from(notionTaskStore.values()).filter(t => t.userId === userId);
  }

  static async deleteByDatabase(databaseId: string): Promise<number> {
    let count = 0;
    const all = Object.fromEntries(notionTaskStore);
    Object.keys(all).forEach(id => {
      const rec = (all as any)[id] as NotionTaskRecord;
      if (rec.databaseId === databaseId) {
        notionTaskStore.delete(id);
        count++;
      }
    });
    writeData(NOTION_TASKS_FILE, Object.fromEntries(notionTaskStore));
    return count;
  }
}

export class NotionUserService {
  static async upsert(user: NotionUserRecord): Promise<NotionUserRecord> {
    const nowIso = new Date().toISOString();
    const existing = notionUserStore.get(user.notionUserId);
    const rec: NotionUserRecord = {
      ...user,
      createdAt: existing?.createdAt || user.createdAt || nowIso,
      updatedAt: nowIso
    };
    notionUserStore.set(user.notionUserId, rec);
    writeData(NOTION_USERS_FILE, Object.fromEntries(notionUserStore));
    return rec;
  }

  static async upsertMany(users: NotionUserRecord[]): Promise<number> {
    for (const u of users) {
      await this.upsert(u);
    }
    return users.length;
  }

  static async getByUser(userId: string): Promise<NotionUserRecord[]> {
    return Array.from(notionUserStore.values()).filter(u => u.userId === userId);
  }

  static async get(notionUserId: string): Promise<NotionUserRecord | null> {
    return notionUserStore.get(notionUserId) || null;
  }
}

export class ExecutionSnapshotService {
  static async upsert(snapshot: Omit<ExecutionSnapshotRecord, 'id' | 'createdAt'> & { id?: string }): Promise<ExecutionSnapshotRecord> {
    const id = snapshot.id || crypto.randomUUID();
    const rec: ExecutionSnapshotRecord = {
      ...snapshot,
      id,
      createdAt: new Date().toISOString()
    } as ExecutionSnapshotRecord;
    executionSnapshotStore.set(id, rec);
    writeData(EXECUTION_SNAPSHOTS_FILE, Object.fromEntries(executionSnapshotStore));
    return rec;
  }

  static async listByUser(userId: string): Promise<ExecutionSnapshotRecord[]> {
    return Array.from(executionSnapshotStore.values()).filter(s => s.userId === userId);
  }

  static async getByWeek(userId: string, weekStartIso: string): Promise<ExecutionSnapshotRecord | null> {
    return (
      Array.from(executionSnapshotStore.values()).find(
        s => s.userId === userId && s.weekStart === weekStartIso
      ) || null
    );
  }
}