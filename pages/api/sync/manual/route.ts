import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '../../../../src/lib/supabase-database';
import { KPISyncService } from '../../../../src/utils/dataSourceIntegrations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, userId = 'demo-user' } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: 'sourceId is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Manual sync requested for data source: ${sourceId}`);

    // Verify data source exists
    const dataSource = await SupabaseDatabaseService.getDataSource(sourceId);
    if (!dataSource) {
      return NextResponse.json(
        { error: `Data source ${sourceId} not found` },
        { status: 404 }
      );
    }

    console.log(`✅ Found data source: ${dataSource.source}`);

    // Perform sync
    const result = await KPISyncService.syncDataSource(sourceId);

    // Get updated KPI count for this source
    const allKpis = await SupabaseDatabaseService.getKPIsByUser(userId);
    const sourceKpis = allKpis.filter(kpi => kpi.source === dataSource.source);

    return NextResponse.json({
      success: result.success,
      syncJob: {
        id: `manual_${Date.now()}`,
        userId,
        sourceId,
        status: result.success ? 'completed' : 'failed',
        startedAt: new Date(),
        completedAt: new Date(),
        errorMessage: result.error,
        metricsSynced: result.metricsSynced
      },
      metricsSynced: result.metricsSynced,
      totalKpisForSource: sourceKpis.length,
      error: result.error,
      dataSource: {
        id: dataSource.id,
        source: dataSource.source,
        isActive: dataSource.isActive,
        lastSyncAt: dataSource.lastSyncAt
      }
    });
  } catch (error) {
    console.error('Error during manual sync:', error);
    return NextResponse.json(
      { error: 'Failed to perform manual sync' },
      { status: 500 }
    );
  }
}







