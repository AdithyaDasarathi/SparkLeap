import type { NextApiRequest, NextApiResponse } from 'next';
import { SupabaseDatabaseService } from '../../src/lib/supabase-database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Get all KPIs for the user
      const kpis = await SupabaseDatabaseService.getKPIsByUser(userId);
      
      // Count KPIs by source
      const sourceCounts = kpis.reduce((acc, kpi) => {
        acc[kpi.source] = (acc[kpi.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // For now, just return basic sync status
      return res.status(200).json({
        success: true,
        totalKpis: kpis.length,
        sourceCounts,
        hasGoogleSheets: sourceCounts['GoogleSheets'] > 0,
        lastSyncTime: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error verifying sync:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to verify sync status' 
      });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}
