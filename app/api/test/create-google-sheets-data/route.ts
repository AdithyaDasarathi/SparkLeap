import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../src/utils/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'demo-user' } = body;

    console.log('🧪 Creating test GoogleSheets KPIs...');
    
    const source = 'GoogleSheets';
    
    // Sample KPI data
    const testKPIs = [
      { metricName: 'MRR' as const, value: 25000 },
      { metricName: 'NetProfit' as const, value: 6500 },
      { metricName: 'BurnRate' as const, value: 8000 },
      { metricName: 'CashOnHand' as const, value: 155000 },
      { metricName: 'UserSignups' as const, value: 50 },
      { metricName: 'Runway' as const, value: 375 },
      { metricName: 'CAC' as const, value: 120 },
      { metricName: 'ChurnRate' as const, value: 2.5 },
      { metricName: 'ActiveUsers' as const, value: 2200 },
      { metricName: 'ConversionRate' as const, value: 3.2 }
    ];
    
    const createdKPIs = [];
    let createdCount = 0;
    
    for (const kpiData of testKPIs) {
      try {
        const kpi = await DatabaseService.createKPI({
          userId,
          metricName: kpiData.metricName,
          source,
          value: kpiData.value,
          timestamp: new Date(),
          lastSyncedAt: new Date(),
          isManualOverride: false,
          status: 'active'
        });
        
        createdKPIs.push({
          id: kpi.id,
          metricName: kpi.metricName,
          value: kpi.value,
          source: kpi.source
        });
        
        createdCount++;
        console.log(`✅ Created ${kpiData.metricName}: ${kpiData.value} (${source})`);
      } catch (error) {
        console.log(`❌ Failed to create ${kpiData.metricName}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // Verify the data was created
    const allKpis = await DatabaseService.getKPIsByUser(userId);
    const googleSheetsKpis = allKpis.filter(kpi => kpi.source === source);
    
    console.log(`📊 Created ${createdCount} test KPIs with source: ${source}`);
    console.log(`📊 Total KPIs for ${source}: ${googleSheetsKpis.length}`);
    
    return NextResponse.json({
      success: true,
      createdCount,
      totalGoogleSheetsKPIs: googleSheetsKpis.length,
      createdKPIs: createdKPIs.slice(0, 5), // Show first 5
      message: `Successfully created ${createdCount} GoogleSheets KPIs`
    });
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
