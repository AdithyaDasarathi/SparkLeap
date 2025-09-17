import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../src/utils/database';
import { KPIMetric } from '../../../../src/types/kpi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'demo-user', days = 30, source = 'GoogleSheets' } = body;

    console.log(`📊 Generating historical data for ${source} over ${days} days...`);

    // Get existing GoogleSheets KPIs
    const allKpis = await DatabaseService.getKPIsByUser(userId);
    console.log(`📊 Total KPIs for user ${userId}: ${allKpis.length}`);
    
    const googleSheetsKpis = allKpis.filter(kpi => kpi.source === source);
    console.log(`📊 GoogleSheets KPIs for user ${userId}: ${googleSheetsKpis.length}`);
    
    // Debug: Show breakdown by source
    const sources = new Set(allKpis.map(kpi => kpi.source));
    console.log(`📊 Sources found: ${Array.from(sources).join(', ')}`);
    
    if (googleSheetsKpis.length === 0) {
      // Check if there are any KPIs at all for this user
      if (allKpis.length === 0) {
        return NextResponse.json({
          success: false,
          error: `No KPIs found for user ${userId}. Please sync data first.`
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `No ${source} KPIs found for user ${userId}. Found ${allKpis.length} total KPIs from sources: ${Array.from(sources).join(', ')}. Please sync data first.`
        });
      }
    }

    // Group KPIs by metric name to get the latest value for each
    const latestKpis = new Map<KPIMetric, any>();
    googleSheetsKpis.forEach(kpi => {
      const existing = latestKpis.get(kpi.metricName);
      if (!existing || new Date(kpi.timestamp) > new Date(existing.timestamp)) {
        latestKpis.set(kpi.metricName, kpi);
      }
    });

    const createdDataPoints = [];
    const now = new Date();

    // Generate historical data for each metric
    for (const [metricName, latestKpi] of latestKpis) {
      const baseValue = latestKpi.isManualOverride ? latestKpi.overrideValue! : latestKpi.value;
      
      // Generate realistic historical data with some variation
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        
        // Add realistic variation based on metric type
        let variation = 0;
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        switch (metricName) {
          case 'MRR':
            // MRR tends to grow over time with some weekly patterns
            variation = (i * -0.02) + Math.sin(i / 7) * 0.05 + (isWeekend ? -0.02 : 0.01);
            break;
          case 'NetProfit':
            // Net profit has more volatility
            variation = (i * -0.01) + Math.sin(i / 5) * 0.08 + Math.cos(i / 3) * 0.05;
            break;
          case 'BurnRate':
            // Burn rate is relatively stable with slight increases
            variation = (i * 0.005) + Math.sin(i / 10) * 0.03;
            break;
          case 'CashOnHand':
            // Cash decreases over time due to burn rate
            variation = (i * -0.015) + Math.sin(i / 7) * 0.05;
            break;
          case 'UserSignups':
            // User signups have weekly patterns
            variation = (i * -0.01) + Math.sin(i / 7) * 0.1 + (isWeekend ? -0.05 : 0.02);
            break;
          case 'Runway':
            // Runway decreases over time
            variation = (i * -0.02) + Math.sin(i / 14) * 0.03;
            break;
          case 'CAC':
            // CAC varies with marketing cycles
            variation = Math.sin(i / 14) * 0.05 + Math.cos(i / 7) * 0.03;
            break;
          case 'ChurnRate':
            // Churn rate has some volatility
            variation = Math.sin(i / 10) * 0.05 + Math.cos(i / 5) * 0.03;
            break;
          case 'ActiveUsers':
            // Active users grow over time with weekly patterns
            variation = (i * -0.01) + Math.sin(i / 7) * 0.08 + (isWeekend ? -0.02 : 0.01);
            break;
          case 'ConversionRate':
            // Conversion rate varies with marketing efforts
            variation = Math.sin(i / 14) * 0.05 + Math.cos(i / 7) * 0.03;
            break;
          default:
            variation = Math.sin(i / 7) * 0.05;
        }

        // Calculate the historical value
        const historicalValue = Math.max(0, baseValue * (1 + variation));
        
        // Create the historical data point
        const historicalKpi = await DatabaseService.createKPI({
          userId,
          metricName,
          source,
          value: historicalValue,
          timestamp: date,
          lastSyncedAt: date,
          isManualOverride: false,
          status: 'active'
        });

        createdDataPoints.push({
          metricName,
          value: historicalValue,
          date: date.toISOString().split('T')[0],
          source
        });
      }
    }

    console.log(`✅ Generated ${createdDataPoints.length} historical data points for ${latestKpis.size} metrics`);

    return NextResponse.json({
      success: true,
      message: `Generated ${createdDataPoints.length} historical data points`,
      dataPoints: createdDataPoints.slice(0, 10), // Show first 10 as sample
      totalMetrics: latestKpis.size,
      totalDataPoints: createdDataPoints.length
    });

  } catch (error) {
    console.error('❌ Error generating historical data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate historical data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
