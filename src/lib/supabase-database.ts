import { supabase, getSupabaseAdmin } from './supabase'
import { KPI, DataSourceConfig, KPISyncJob, KPIInsight } from '../types/kpi'
import { Task } from '../types/task'

export class SupabaseDatabaseService {
  // KPI Operations
  static async createKPI(kpi: Omit<KPI, 'id'>): Promise<KPI> {
    const { data, error } = await supabase
      .from('kpis')
      .insert({
        user_id: kpi.userId,
        metric_name: kpi.metricName,
        source: kpi.source,
        value: kpi.value,
        timestamp: kpi.timestamp,
        last_synced_at: kpi.lastSyncedAt,
        is_manual_override: kpi.isManualOverride,
        override_value: kpi.overrideValue,
        status: kpi.status
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getKPI(id: string): Promise<KPI | null> {
    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  static async getKPIsByUser(userId: string): Promise<KPI[]> {
    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async updateKPI(id: string, updates: Partial<KPI>): Promise<KPI | null> {
    const { data, error } = await supabase
      .from('kpis')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return null
    return data
  }

  static async deleteKPI(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('kpis')
      .delete()
      .eq('id', id)

    return !error
  }

  // Data Source Operations
  static async createDataSource(config: Omit<DataSourceConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataSourceConfig> {
    const { data, error } = await supabase
      .from('data_sources')
      .insert({
        user_id: config.userId,
        source: config.source,
        config: (config as any).config || {},
        credentials: config.credentials,
        is_active: config.isActive,
        last_sync_at: config.lastSyncAt
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getDataSource(id: string): Promise<DataSourceConfig | null> {
    const { data, error } = await supabase
      .from('data_sources')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  static async getDataSourcesByUser(userId: string): Promise<DataSourceConfig[]> {
    const { data, error } = await supabase
      .from('data_sources')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  static async updateDataSource(id: string, updates: Partial<DataSourceConfig>): Promise<DataSourceConfig | null> {
    const { data, error } = await supabase
      .from('data_sources')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return null
    return data
  }

  static async deleteDataSource(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('data_sources')
      .delete()
      .eq('id', id)

    return !error
  }

  // Utility methods
  static encryptCredentials(credentials: any): { encryptedData: string; iv: string } {
    // Simple base64 encoding for now - in production, use proper encryption
    const encryptedData = Buffer.from(JSON.stringify(credentials)).toString('base64')
    return {
      encryptedData,
      iv: 'dummy-iv' // In production, use proper IV
    }
  }

  static decryptCredentials(encryptedCredentials: { encryptedData: string; iv: string }): any {
    // Simple base64 decoding for now - in production, use proper decryption
    return JSON.parse(Buffer.from(encryptedCredentials.encryptedData, 'base64').toString())
  }

  // Sync Job Operations
  static async createSyncJob(job: Omit<KPISyncJob, 'id'>): Promise<KPISyncJob> {
    const { data, error } = await supabase
      .from('sync_jobs')
      .insert({
        user_id: job.userId,
        data_source_id: (job as any).dataSourceId || (job as any).sourceId,
        status: job.status,
        started_at: job.startedAt,
        completed_at: job.completedAt,
        error_message: job.errorMessage,
        records_processed: (job as any).recordsProcessed || 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getSyncJob(id: string): Promise<KPISyncJob | null> {
    const { data, error } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  static async getSyncJobsByUser(userId: string, limit = 50): Promise<KPISyncJob[]> {
    const { data, error } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async updateSyncJob(id: string, updates: Partial<KPISyncJob>): Promise<KPISyncJob | null> {
    const { data, error } = await supabase
      .from('sync_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return null
    return data
  }

  // Insight Operations
  static async createInsight(insight: Omit<KPIInsight, 'id'>): Promise<KPIInsight> {
    const { data, error } = await supabase
      .from('insights')
      .insert({
        user_id: insight.userId,
        title: (insight as any).title || '',
        content: (insight as any).content || '',
        insight_type: (insight as any).insightType || 'general',
        generated_at: insight.generatedAt,
        is_read: insight.isRead
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getInsightsByUser(userId: string): Promise<KPIInsight[]> {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async markInsightAsRead(id: string): Promise<KPIInsight | null> {
    const { data, error } = await supabase
      .from('insights')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single()

    if (error) return null
    return data
  }

  // Task Operations
  static async getTasksByUser(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async createTask(task: Omit<Task, 'id'> & { userId: string }): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: task.userId,
        title: task.title,
        description: (task as any).description || '',
        status: (task as any).status || 'pending',
        priority: task.priority,
        due_date: task.dueDate
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteTask(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    return !error
  }

  static async clearUserTasks(userId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
  }

  // Analytics and reporting
  static async getKPITrends(userId: string, metricName: string, days: number = 30): Promise<any[]> {
    const { data, error } = await supabase
      .from('kpis')
      .select('value, timestamp')
      .eq('user_id', userId)
      .eq('metric_name', metricName)
      .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getSyncStatus(userId: string): Promise<{ active: number; error: number; pending: number }> {
    const { data, error } = await supabase
      .from('data_sources')
      .select('is_active, last_sync_at')
      .eq('user_id', userId)

    if (error) throw error

    const status = { active: 0, error: 0, pending: 0 }
    
    data?.forEach(source => {
      if (source.is_active) {
        if (source.last_sync_at) {
          const hoursSinceLastSync = (Date.now() - new Date(source.last_sync_at).getTime()) / (1000 * 60 * 60)
          if (hoursSinceLastSync > 24) {
            status.error++
          } else {
            status.active++
          }
        } else {
          status.pending++
        }
      }
    })
    
    return status
  }

  // Seed sample data for all KPI metrics
  static async seedSampleData(userId: string): Promise<void> {
    const now = new Date()
    const metrics = [
      'MRR', 'NetProfit', 'BurnRate', 'CashOnHand', 'UserSignups', 'Runway',
      'CAC', 'ChurnRate', 'ActiveUsers', 'ConversionRate'
    ]

    // Generate 30 days of sample data
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
      
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
      }

      for (const metric of metrics) {
        const value = sampleData[metric as keyof typeof sampleData]
        await this.createKPI({
          userId,
          metricName: metric as any,
          source: 'Manual',
          value: Math.max(0, value),
          timestamp: date,
          lastSyncedAt: date,
          isManualOverride: false,
          status: 'active'
        })
      }
    }
  }

  // Utility method to generate IDs
  static generateId(): string {
    return crypto.randomUUID()
  }
}
