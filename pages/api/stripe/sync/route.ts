import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../src/utils/database';
import { KPISyncService } from '../../../../src/utils/dataSourceIntegrations';

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

    console.log(`🔄 Starting Stripe sync for data source: ${sourceId}`);

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
    console.error('Error during Stripe sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync Stripe data' },
      { status: 500 }
    );
  }
}
