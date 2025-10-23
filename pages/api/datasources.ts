import type { NextApiRequest, NextApiResponse } from 'next';
import { SupabaseDatabaseService } from '../../src/lib/supabase-database';
import { DataSource, SyncFrequency } from '../../src/types/kpi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId is required' });
      }

      const dataSources = await SupabaseDatabaseService.getDataSourcesByUser(userId);
      const syncStatus = await SupabaseDatabaseService.getSyncStatus(userId);

      return res.status(200).json({ dataSources, syncStatus });
    } catch (error) {
      console.error('Error fetching data sources:', error);
      return res.status(500).json({ error: 'Failed to fetch data sources' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId, source, credentials, syncFrequency = 'daily' } = req.body;

      console.log('📊 Data source creation request:', { userId, source, syncFrequency, hasCredentials: !!credentials });

      if (!userId || !source || !credentials) {
        console.error('❌ Missing required fields:', { userId: !!userId, source: !!source, credentials: !!credentials });
        return res.status(400).json({ error: 'userId, source, and credentials are required' });
      }

      // Encrypt credentials before storing
      const encryptedCredentials = SupabaseDatabaseService.encryptCredentials(credentials);
      console.log('🔐 Credentials encrypted successfully');

      const dataSource = await SupabaseDatabaseService.createDataSource({
        userId,
        source: source as DataSource,
        isActive: true,
        credentials: encryptedCredentials,
        syncFrequency: syncFrequency as SyncFrequency
      });

      console.log('✅ Data source created successfully:', dataSource.id);
      return res.status(201).json({ dataSource });
    } catch (error) {
      console.error('❌ Error creating data source:', error);
      return res.status(500).json({ error: 'Failed to create data source' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, isActive, syncFrequency, credentials } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const updates: any = {};
      
      if (isActive !== undefined) updates.isActive = isActive;
      if (syncFrequency) updates.syncFrequency = syncFrequency;
      if (credentials) {
        updates.credentials = SupabaseDatabaseService.encryptCredentials(credentials);
      }

      const dataSource = await SupabaseDatabaseService.updateDataSource(id, updates);
      
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }

      return res.status(200).json({ dataSource });
    } catch (error) {
      console.error('Error updating data source:', error);
      return res.status(500).json({ error: 'Failed to update data source' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      console.log('🗑️ Main datasources API: DELETE request received', { id, query: req.query });

      if (!id || typeof id !== 'string') {
        console.log('❌ Main datasources API: No ID provided');
        return res.status(400).json({ error: 'id is required' });
      }

      console.log('🗑️ Main datasources API: Deleting data source:', id);
      const success = await SupabaseDatabaseService.deleteDataSource(id);
      console.log('🗑️ Main datasources API: Delete result:', success);
      
      if (!success) {
        console.log('❌ Main datasources API: Data source not found or delete failed');
        return res.status(404).json({ error: 'Data source not found' });
      }

      console.log('✅ Main datasources API: Data source deleted successfully');
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Main datasources API: Error deleting data source:', error);
      return res.status(500).json({ error: 'Failed to delete data source' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
} 