import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../src/utils/database';
import { KPISyncService } from '../../../src/utils/dataSourceIntegrations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, userId } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: 'sourceId is required' },
        { status: 400 }
      );
    }

    // Create sync job
    const syncJob = await DatabaseService.createSyncJob({
      userId: userId || 'unknown',
      sourceId,
      status: 'running',
      startedAt: new Date(),
      metricsSynced: 0
    });

    // Perform sync
    const result = await KPISyncService.syncDataSource(sourceId);

    // Update sync job with result
    await DatabaseService.updateSyncJob(syncJob.id, {
      status: result.success ? 'completed' : 'failed',
      completedAt: new Date(),
      errorMessage: result.error,
      metricsSynced: result.metricsSynced
    });

    return NextResponse.json({
      success: result.success,
      syncJob,
      metricsSynced: result.metricsSynced,
      error: result.error
    });
  } catch (error) {
    console.error('Error during sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync data source' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const syncJobs = await DatabaseService.getSyncJobsByUser(userId, limit);
    return NextResponse.json({ syncJobs });
  } catch (error) {
    console.error('Error fetching sync jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync jobs' },
      { status: 500 }
    );
  }
}

// Endpoint to trigger scheduled syncs (called by CRON job)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'schedule') {
      await KPISyncService.scheduleSyncJobs();
      return NextResponse.json({ success: true, message: 'Scheduled syncs completed' });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error scheduling syncs:', error);
    return NextResponse.json(
      { error: 'Failed to schedule syncs' },
      { status: 500 }
    );
  }
} 