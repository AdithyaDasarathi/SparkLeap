import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../src/utils/database';
import { KPIMetric } from '../../../../src/types/kpi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    const metricName = searchParams.get('metricName') as KPIMetric || 'MRR';

    console.log(`🔍 Debug: Checking trends for ${metricName} for user ${userId}`);

    // Get all KPIs for the user
    const allKpis = await DatabaseService.getKPIsByUser(userId);
    console.log(`📊 Total KPIs for user ${userId}: ${allKpis.length}`);
    
    // Get trends for the specific metric
    const trends = await DatabaseService.getKPITrends(userId, metricName, 30);
    console.log(`📈 Trends for ${metricName}: ${trends.length} data points`);
    
    // Show sample data
    const sampleTrends = trends.slice(0, 5);
    console.log(`📋 Sample trends data:`, sampleTrends);

    // Check data structure
    const dataStructure = trends.length > 0 ? Object.keys(trends[0]) : [];
    console.log(`📋 Data structure keys:`, dataStructure);

    // Test chart data format
    const chartData = trends.map(trend => ({
      value: trend.value,
      timestamp: trend.timestamp
    }));

    return NextResponse.json({
      success: true,
      userId,
      metricName,
      totalTrends: trends.length,
      dataStructure,
      sampleTrends,
      chartData: chartData.slice(0, 5),
      allKpisCount: allKpis.length,
      kpisBySource: allKpis.reduce((acc, kpi) => {
        acc[kpi.source] = (acc[kpi.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

  } catch (error) {
    console.error('❌ Debug trends API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to debug trends',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




