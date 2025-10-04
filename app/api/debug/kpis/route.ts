import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../src/utils/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    console.log(`🔍 Debug: Checking KPIs for user ${userId}`);

    // Get all KPIs for the user
    const allKpis = await DatabaseService.getKPIsByUser(userId);
    
    // Group by source
    const bySource = {};
    allKpis.forEach(kpi => {
      if (!bySource[kpi.source]) {
        bySource[kpi.source] = [];
      }
      bySource[kpi.source].push({
        metricName: kpi.metricName,
        value: kpi.value,
        timestamp: kpi.timestamp,
        id: kpi.id
      });
    });

    // Get unique metrics
    const uniqueMetrics = new Set(allKpis.map(kpi => kpi.metricName));

    return NextResponse.json({
      success: true,
      userId,
      totalKpis: allKpis.length,
      uniqueMetrics: Array.from(uniqueMetrics),
      breakdownBySource: Object.entries(bySource).map(([source, kpis]) => ({
        source,
        count: kpis.length,
        metrics: [...new Set(kpis.map((kpi: any) => kpi.metricName))]
      })),
      sampleKpis: allKpis.slice(0, 5).map(kpi => ({
        id: kpi.id,
        metricName: kpi.metricName,
        source: kpi.source,
        value: kpi.value,
        timestamp: kpi.timestamp
      }))
    });

  } catch (error) {
    console.error('❌ Debug API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to debug KPIs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
