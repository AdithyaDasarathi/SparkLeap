import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '../../../../src/lib/supabase-database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    const source = searchParams.get('source') || 'GoogleSheets';
    const hours = parseInt(searchParams.get('hours') || '24');

    console.log(`🔍 Verifying sync data for user: ${userId}, source: ${source}, last ${hours} hours`);

    // Get all KPIs for the user from the specified source
    const allKpis = await SupabaseDatabaseService.getKPIsByUser(userId);
    
    // Filter for the specific source and recent data
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const recentKpis = allKpis.filter(kpi => 
      kpi.source === source && 
      new Date(kpi.lastSyncedAt) >= cutoffTime
    );

    // Also get data source info to verify it exists
    const dataSources = await SupabaseDatabaseService.getDataSourcesByUser(userId);
    const targetDataSource = dataSources.find(ds => ds.source === source);
    
    if (!targetDataSource) {
      console.log(`❌ No data source found for ${source}`);
      return NextResponse.json({
        success: false,
        error: `No data source found for ${source}`,
        verification: {
          totalKpisFound: allKpis.length,
          recentKpisFromSource: 0,
          latestSyncedMetrics: [],
          dataSource: null
        }
      });
    }

    console.log(`📊 Total KPIs found: ${allKpis.length}`);
    console.log(`📊 KPIs from ${source}: ${allKpis.filter(kpi => kpi.source === source).length}`);
    console.log(`📊 Recent KPIs from ${source}: ${recentKpis.length}`);
    console.log(`📊 Cutoff time: ${cutoffTime.toISOString()}`);
    
    // Debug: Show all unique sources in the data
    const uniqueSources = new Set(allKpis.map(kpi => kpi.source));
    console.log(`📊 All unique sources found:`, Array.from(uniqueSources));
    
    // Debug: Show KPIs by source
    const kpisBySource = allKpis.reduce((acc, kpi) => {
      acc[kpi.source] = (acc[kpi.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`📊 KPIs by source:`, kpisBySource);
    
    // Debug: Show some sample KPIs
    const sampleKpis = allKpis.filter(kpi => kpi.source === source).slice(0, 3);
    sampleKpis.forEach(kpi => {
      console.log(`📋 Sample KPI: ${kpi.metricName} = ${kpi.value}, lastSyncedAt: ${kpi.lastSyncedAt}`);
    });
    
    // Debug: Show ALL KPIs from GoogleSheets (not just recent ones)
    const allGoogleSheetsKpis = allKpis.filter(kpi => kpi.source === source);
    console.log(`📊 ALL GoogleSheets KPIs (${allGoogleSheetsKpis.length}):`);
    allGoogleSheetsKpis.forEach(kpi => {
      console.log(`  - ${kpi.metricName}: ${kpi.value} (${kpi.lastSyncedAt})`);
    });

    // Always get the latest GoogleSheets KPIs regardless of timestamp for better verification
    console.log('🔍 Getting latest GoogleSheets KPIs for verification...');
    
    console.log(`📊 Total GoogleSheets KPIs found: ${allGoogleSheetsKpis.length}`);
    
    // Show some sample KPIs from different sources
    const sampleKpisFromAllSources = allKpis.slice(0, 5);
    sampleKpisFromAllSources.forEach(kpi => {
      console.log(`📋 Sample KPI: ${kpi.metricName} = ${kpi.value}, source: ${kpi.source}, lastSyncedAt: ${kpi.lastSyncedAt}`);
    });
    
    // Get the latest value for each metric
    const latestMetrics = new Map<string, any>();
    allGoogleSheetsKpis.forEach(kpi => {
      const existing = latestMetrics.get(kpi.metricName);
      if (!existing || new Date(kpi.lastSyncedAt) > new Date(existing.lastSyncedAt)) {
        latestMetrics.set(kpi.metricName, {
          metricName: kpi.metricName,
          value: kpi.value,
          lastSyncedAt: kpi.lastSyncedAt,
          source: kpi.source,
          isManualOverride: kpi.isManualOverride
        });
      }
    });

    const syncedData = Array.from(latestMetrics.values());
    console.log(`📊 Found ${syncedData.length} latest GoogleSheets KPIs:`, syncedData.map(m => `${m.metricName}: ${m.value}`));
    
    // Debug: Show all unique metrics found
    const uniqueMetrics = new Set(allGoogleSheetsKpis.map(kpi => kpi.metricName));
    console.log(`📊 Unique metrics in GoogleSheets data:`, Array.from(uniqueMetrics));
    
    // Also get data source info
    const allDataSources = await SupabaseDatabaseService.getDataSourcesByUser(userId);
    console.log(`📊 Found ${allDataSources.length} data sources for user ${userId}`);
    allDataSources.forEach(ds => {
      console.log(`  - ${ds.id}: ${ds.source} (${ds.isActive ? 'active' : 'inactive'})`);
    });
    
    const googleSheetsSource = allDataSources.find(ds => ds.source === 'GoogleSheets');

    return NextResponse.json({
      success: true,
      verification: {
        totalKpisFound: allKpis.length,
        recentKpisFromSource: recentKpis.length,
        latestSyncedMetrics: syncedData,
        dataSource: googleSheetsSource ? {
          id: googleSheetsSource.id,
          isActive: googleSheetsSource.isActive,
          lastSyncAt: googleSheetsSource.lastSyncAt,
          syncFrequency: googleSheetsSource.syncFrequency
        } : null
      }
    });

  } catch (error) {
    console.error('Error verifying sync data:', error);
    return NextResponse.json(
      { error: 'Failed to verify sync data' },
      { status: 500 }
    );
  }
}
