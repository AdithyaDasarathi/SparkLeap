import type { NextApiRequest, NextApiResponse } from 'next';
import { SupabaseDatabaseService } from '../../../src/lib/supabase-database';
import { KPIMetric } from '../../../src/types/kpi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { userId = 'demo-user', days = 30, source = 'GoogleSheets' } = req.body;

      if (!userId) {
        return res.status(400).json({ 
          success: false,
          error: 'userId is required' 
        });
      }

      console.log(`📊 Generating historical data for ${source} over ${days} days...`);

      // Get existing KPIs for the user
      const allKpis = await SupabaseDatabaseService.getKPIsByUser(userId);
      console.log(`📊 Total KPIs for user ${userId}: ${allKpis.length}`);
      
      const sourceKpis = allKpis.filter(kpi => kpi.source === source);
      console.log(`📊 ${source} KPIs for user ${userId}: ${sourceKpis.length}`);
      
      // Debug: Show breakdown by source
      const sources = new Set(allKpis.map(kpi => kpi.source));
      console.log(`📊 Sources found: ${Array.from(sources).join(', ')}`);
      
      if (sourceKpis.length === 0) {
        // Check if there are any KPIs at all for this user
        if (allKpis.length === 0) {
          return res.status(400).json({
            success: false,
            error: `No KPIs found for user ${userId}. Please sync data first.`
          });
        } else {
          return res.status(400).json({
            success: false,
            error: `No ${source} KPIs found for user ${userId}. Found ${allKpis.length} total KPIs from sources: ${Array.from(sources).join(', ')}. Please sync data first.`
          });
        }
      }

      // Group KPIs by metric name to get the latest value for each
      const latestKpis = new Map<KPIMetric, any>();
      sourceKpis.forEach(kpi => {
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
        for (let i = 0; i < days; i++) {
          const date = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
          
          // Add some realistic variation to the base value
          const variation = Math.sin(i / 7) * 0.1 + Math.cos(i / 5) * 0.05; // Smooth variation
          const randomNoise = (Math.random() - 0.5) * 0.05; // Small random noise
          const trendFactor = (i / days) * 0.1; // Slight upward trend over time
          
          const historicalValue = baseValue * (1 + variation + randomNoise + trendFactor);
          
          // Ensure positive values for metrics that should be positive
          const finalValue = Math.max(0.1, historicalValue);
          
          try {
            await SupabaseDatabaseService.createKPI({
              userId,
              metricName,
              source: source,
              value: finalValue,
              timestamp: date,
              lastSyncedAt: date,
              isManualOverride: false,
              status: 'active'
            });
            
            createdDataPoints.push({
              metricName,
              value: finalValue,
              date: date.toISOString()
            });
          } catch (error) {
            console.warn(`⚠️ Failed to create historical data point for ${metricName} on ${date.toISOString()}:`, error);
          }
        }
      }

      console.log(`📈 Generated ${createdDataPoints.length} historical data points for ${latestKpis.size} metrics`);

      return res.status(200).json({
        success: true,
        totalDataPoints: createdDataPoints.length,
        totalMetrics: latestKpis.size,
        metrics: Array.from(latestKpis.keys()),
        message: `Successfully generated ${createdDataPoints.length} historical data points for ${latestKpis.size} metrics`
      });

    } catch (error) {
      console.error('❌ Error generating historical data:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to generate historical data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
