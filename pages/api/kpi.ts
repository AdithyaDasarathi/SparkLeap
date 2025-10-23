import type { NextApiRequest, NextApiResponse } from 'next';
import { SupabaseDatabaseService } from '../../src/lib/supabase-database';
import { KPIMetric } from '../../src/types/kpi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { userId, metricName, days = '30' } = req.query;
      const parsedDays = parseInt(days as string);

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId is required' });
      }

      if (metricName) {
        // Get trend data for specific metric
        let trends = await SupabaseDatabaseService.getKPITrends(userId, metricName as KPIMetric, parsedDays);
        
        console.log(`📊 KPI API - Fetching trends for ${metricName}, userId: ${userId}, found ${trends.length} trends`);
      
        // Only seed sample data if there's no real data at all (including Google Sheets)
        const allKpis = await SupabaseDatabaseService.getKPIsByUser(userId);
        const hasRealData = allKpis.some(kpi => kpi.source !== 'Manual');
        
        console.log(`📊 KPI API - Total KPIs for user: ${allKpis.length}, hasRealData: ${hasRealData}`);
        console.log(`📊 KPI API - KPI sources:`, allKpis.map(k => ({ metric: k.metricName, source: k.source, timestamp: k.timestamp })));
        
        if (trends.length === 0 && !hasRealData) {
          console.log('📊 No real data found, seeding sample data...');
          await SupabaseDatabaseService.seedSampleData(userId);
          trends = await SupabaseDatabaseService.getKPITrends(userId, metricName as KPIMetric, parsedDays);
        } else if (trends.length === 0 && hasRealData) {
          console.log('📊 Real data exists but no trends for this metric, using latest value');
          // Get the latest value for this metric from any source
          const latestKpi = allKpis
            .filter(kpi => kpi.metricName === metricName)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          
          if (latestKpi) {
            console.log(`📊 Using latest KPI value: ${latestKpi.value} from ${latestKpi.source}`);
            trends = [{
              value: latestKpi.isManualOverride ? latestKpi.overrideValue! : latestKpi.value,
              timestamp: latestKpi.timestamp
            }];
          }
        }
        
        console.log(`📊 KPI API - Returning ${trends.length} trends for ${metricName}`);
        return res.status(200).json({ trends });
      } else {
        // Get all KPIs for user
        let kpis = await SupabaseDatabaseService.getKPIsByUser(userId);
        
        // Only seed sample data if there's no real data at all
        const hasRealData = kpis.some(kpi => kpi.source !== 'Manual');
        
        if (kpis.length === 0 && !hasRealData) {
          console.log('📊 No real data found, seeding sample data...');
          await SupabaseDatabaseService.seedSampleData(userId);
          kpis = await SupabaseDatabaseService.getKPIsByUser(userId);
        }
        
        return res.status(200).json({ kpis });
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      return res.status(500).json({ error: 'Failed to fetch KPIs' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId, metricName, value, source = 'Manual' } = req.body;

      if (!userId || !metricName || value === undefined) {
        return res.status(400).json({ error: 'userId, metricName, and value are required' });
      }

      const kpi = await SupabaseDatabaseService.createKPI({
        userId,
        metricName,
        source,
        value: parseFloat(value),
        timestamp: new Date(),
        lastSyncedAt: new Date(),
        isManualOverride: false,
        status: 'active'
      });

      return res.status(201).json({ kpi });
    } catch (error) {
      console.error('Error creating KPI:', error);
      return res.status(500).json({ error: 'Failed to create KPI' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, value, isManualOverride = true } = req.body;

      if (!id || value === undefined) {
        return res.status(400).json({ error: 'id and value are required' });
      }

      const updates: any = {
        isManualOverride,
        lastSyncedAt: new Date()
      };

      if (isManualOverride) {
        updates.overrideValue = parseFloat(value);
        updates.overrideTimestamp = new Date();
      } else {
        updates.value = parseFloat(value);
      }

      const kpi = await SupabaseDatabaseService.updateKPI(id, updates);
      
      if (!kpi) {
        return res.status(404).json({ error: 'KPI not found' });
      }

      return res.status(200).json({ kpi });
    } catch (error) {
      console.error('Error updating KPI:', error);
      return res.status(500).json({ error: 'Failed to update KPI' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'id is required' });
      }

      const success = await SupabaseDatabaseService.deleteKPI(id);
      
      if (!success) {
        return res.status(404).json({ error: 'KPI not found' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting KPI:', error);
      return res.status(500).json({ error: 'Failed to delete KPI' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
} 