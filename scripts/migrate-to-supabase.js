const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateData() {
  try {
    console.log('🚀 Starting data migration to Supabase...')
    
    // Read existing JSON files
    const dataDir = path.join(process.cwd(), 'data')
    
    // Check if data directory exists
    if (!fs.existsSync(dataDir)) {
      console.log('📁 No data directory found, skipping migration')
      return
    }

    // Migrate KPIs
    if (fs.existsSync(path.join(dataDir, 'kpis.json'))) {
      console.log('📊 Migrating KPIs...')
      const kpis = JSON.parse(fs.readFileSync(path.join(dataDir, 'kpis.json'), 'utf8'))
      
      const kpiValues = Object.values(kpis).map(kpi => ({
        id: kpi.id,
        user_id: kpi.userId,
        metric_name: kpi.metricName,
        source: kpi.source,
        value: kpi.value,
        timestamp: kpi.timestamp,
        last_synced_at: kpi.lastSyncedAt,
        is_manual_override: kpi.isManualOverride || false,
        override_value: kpi.overrideValue,
        status: kpi.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      if (kpiValues.length > 0) {
        const { error: kpiError } = await supabase
          .from('kpis')
          .insert(kpiValues)

        if (kpiError) {
          console.error('❌ KPI migration error:', kpiError)
        } else {
          console.log(`✅ Migrated ${kpiValues.length} KPIs`)
        }
      }
    }

    // Migrate Data Sources
    if (fs.existsSync(path.join(dataDir, 'datasources.json'))) {
      console.log('🔗 Migrating Data Sources...')
      const dataSources = JSON.parse(fs.readFileSync(path.join(dataDir, 'datasources.json'), 'utf8'))
      
      const dataSourceValues = Object.values(dataSources).map(ds => ({
        id: ds.id,
        user_id: ds.userId,
        source: ds.source,
        config: ds.config,
        credentials: ds.credentials,
        is_active: ds.isActive,
        last_sync_at: ds.lastSyncAt,
        created_at: ds.createdAt,
        updated_at: ds.updatedAt
      }))

      if (dataSourceValues.length > 0) {
        const { error: dsError } = await supabase
          .from('data_sources')
          .insert(dataSourceValues)

        if (dsError) {
          console.error('❌ Data source migration error:', dsError)
        } else {
          console.log(`✅ Migrated ${dataSourceValues.length} Data Sources`)
        }
      }
    }

    // Migrate Sync Jobs
    if (fs.existsSync(path.join(dataDir, 'syncjobs.json'))) {
      console.log('⚙️ Migrating Sync Jobs...')
      const syncJobs = JSON.parse(fs.readFileSync(path.join(dataDir, 'syncjobs.json'), 'utf8'))
      
      const syncJobValues = Object.values(syncJobs).map(job => ({
        id: job.id,
        user_id: job.userId,
        data_source_id: job.dataSourceId,
        status: job.status,
        started_at: job.startedAt,
        completed_at: job.completedAt,
        error_message: job.errorMessage,
        records_processed: job.recordsProcessed || 0,
        created_at: job.createdAt || new Date().toISOString()
      }))

      if (syncJobValues.length > 0) {
        const { error: sjError } = await supabase
          .from('sync_jobs')
          .insert(syncJobValues)

        if (sjError) {
          console.error('❌ Sync job migration error:', sjError)
        } else {
          console.log(`✅ Migrated ${syncJobValues.length} Sync Jobs`)
        }
      }
    }

    // Migrate Insights
    if (fs.existsSync(path.join(dataDir, 'insights.json'))) {
      console.log('💡 Migrating Insights...')
      const insights = JSON.parse(fs.readFileSync(path.join(dataDir, 'insights.json'), 'utf8'))
      
      const insightValues = Object.values(insights).map(insight => ({
        id: insight.id,
        user_id: insight.userId,
        title: insight.title,
        content: insight.content,
        insight_type: insight.insightType,
        generated_at: insight.generatedAt,
        is_read: insight.isRead || false,
        created_at: insight.createdAt || new Date().toISOString()
      }))

      if (insightValues.length > 0) {
        const { error: insightError } = await supabase
          .from('insights')
          .insert(insightValues)

        if (insightError) {
          console.error('❌ Insight migration error:', insightError)
        } else {
          console.log(`✅ Migrated ${insightValues.length} Insights`)
        }
      }
    }

    // Migrate Tasks
    if (fs.existsSync(path.join(dataDir, 'tasks.json'))) {
      console.log('📋 Migrating Tasks...')
      const tasks = JSON.parse(fs.readFileSync(path.join(dataDir, 'tasks.json'), 'utf8'))
      
      const taskValues = Object.values(tasks).map(task => ({
        id: task.id,
        user_id: task.userId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate,
        created_at: task.createdAt || new Date().toISOString(),
        updated_at: task.updatedAt || new Date().toISOString()
      }))

      if (taskValues.length > 0) {
        const { error: taskError } = await supabase
          .from('tasks')
          .insert(taskValues)

        if (taskError) {
          console.error('❌ Task migration error:', taskError)
        } else {
          console.log(`✅ Migrated ${taskValues.length} Tasks`)
        }
      }
    }

    console.log('🎉 Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

migrateData()
