import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../src/utils/database';
import { NotionIntegration } from '../../../src/utils/dataSourceIntegrations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sourceId = searchParams.get('sourceId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get Notion data source
    const dataSource = sourceId 
      ? await DatabaseService.getDataSource(sourceId)
      : await DatabaseService.getDataSourcesByUser(userId).then(sources => 
          sources.find(s => s.source === 'Notion')
        );

    if (!dataSource) {
      return NextResponse.json({ error: 'Notion data source not found' }, { status: 404 });
    }

    // Decrypt credentials
    const decryptedCredentials = DatabaseService.decryptCredentials(
      dataSource.credentials.encryptedData,
      dataSource.credentials.iv
    );

    // Create Notion integration
    const notionIntegration = new NotionIntegration(decryptedCredentials, userId);

    // Get task analytics
    const taskAnalytics = await notionIntegration.getTaskAnalytics();

    return NextResponse.json({ 
      taskAnalytics,
      lastSync: dataSource.lastSyncAt,
      isActive: dataSource.isActive
    });
  } catch (error) {
    console.error('Error fetching Notion analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sourceId, action } = body;

    console.log('📥 Notion API request:', { userId, sourceId, action });

    if (!userId || !sourceId || !action) {
      console.log('❌ Missing required parameters');
      return NextResponse.json(
        { error: 'userId, sourceId, and action are required' },
        { status: 400 }
      );
    }

    // Get data source
    console.log(`🔍 Looking for data source: ${sourceId}`);
    const dataSource = await DatabaseService.getDataSource(sourceId);
    
    if (!dataSource) {
      console.log('❌ Data source not found');
      
      // Let's check what data sources exist for this user
      const allDataSources = await DatabaseService.getDataSourcesByUser(userId);
      console.log(`📋 Available data sources for user ${userId}:`, allDataSources.length);
      
      return NextResponse.json({ 
        error: 'Notion data source not found',
        debug: {
          requestedSourceId: sourceId,
          availableDataSources: allDataSources.map(ds => ({
            id: ds.id,
            source: ds.source,
            isActive: ds.isActive
          }))
        }
      }, { status: 404 });
    }
    
    if (dataSource.source !== 'Notion') {
      console.log(`❌ Data source is not Notion: ${dataSource.source}`);
      return NextResponse.json({ 
        error: 'Data source is not a Notion integration',
        debug: {
          actualSource: dataSource.source,
          requestedSource: 'Notion'
        }
      }, { status: 400 });
    }

    console.log('✅ Data source found:', {
      id: dataSource.id,
      source: dataSource.source,
      isActive: dataSource.isActive
    });

    // Decrypt credentials
    const decryptedCredentials = DatabaseService.decryptCredentials(
      dataSource.credentials.encryptedData,
      dataSource.credentials.iv
    );

    // Create Notion integration
    const notionIntegration = new NotionIntegration(decryptedCredentials, userId);

    switch (action) {
      case 'sync':
        console.log('🔄 Starting sync...');
        const syncResult = await notionIntegration.sync();
        console.log('✅ Sync completed:', syncResult.success);
        return NextResponse.json({ syncResult });

      case 'test':
        console.log('🧪 Testing connection...');
        const isConnected = await notionIntegration.testConnection();
        console.log('✅ Connection test result:', isConnected);
        return NextResponse.json({ isConnected });

      case 'analytics':
        console.log('📊 Getting analytics...');
        const analytics = await notionIntegration.getTaskAnalytics();
        console.log('✅ Analytics retrieved');
        return NextResponse.json({ analytics });

      case 'createTask':
        const { title, priority, goalCategory, dueDate } = body;
        if (!title) {
          return NextResponse.json(
            { error: 'Task title is required' },
            { status: 400 }
          );
        }
        console.log('📝 Creating task:', { title, priority, goalCategory, dueDate });
        const taskCreated = await notionIntegration.createTask({
          title,
          priority,
          goalCategory,
          dueDate
        });
        console.log('✅ Task creation result:', taskCreated);
        return NextResponse.json({ success: taskCreated });

      case 'updateTaskStatus':
        const { pageId, status } = body;
        if (!pageId || !status) {
          return NextResponse.json(
            { error: 'Page ID and status are required' },
            { status: 400 }
          );
        }
        console.log('🔄 Updating task status:', { pageId, status });
        const statusUpdated = await notionIntegration.updateTaskStatus(pageId, status);
        console.log('✅ Status update result:', statusUpdated);
        return NextResponse.json({ success: statusUpdated });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: sync, test, analytics, createTask, updateTaskStatus' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Error processing Notion request:', error);
    return NextResponse.json(
      { error: 'Failed to process Notion request' },
      { status: 500 }
    );
  }
} 