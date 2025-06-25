import { DataSource, KPIMetric } from '../types/kpi';
import { DatabaseService } from './database';

export interface IntegrationResult {
  success: boolean;
  data?: Record<KPIMetric, number>;
  error?: string;
  metricsSynced: number;
}

export abstract class DataSourceIntegration {
  protected credentials: string;
  protected userId: string;

  constructor(credentials: string, userId: string) {
    this.credentials = credentials;
    this.userId = userId;
  }

  abstract sync(): Promise<IntegrationResult>;
  abstract testConnection(): Promise<boolean>;
}

export class StripeIntegration extends DataSourceIntegration {
  async sync(): Promise<IntegrationResult> {
    try {
      // Mock Stripe API call - replace with actual Stripe SDK
      // const stripe = require('stripe')(this.credentials);
      
      // Get subscription data for MRR calculation
      // const subscriptions = await stripe.subscriptions.list({
      //   status: 'active',
      //   limit: 100
      // });

      // Mock data for MVP
      const data: Record<KPIMetric, number> = {
        MRR: 12500,
        ChurnRate: 5.2,
        CAC: 150,
        LTV: 2500,
        DAU: 0, // Not available from Stripe
        WAU: 0, // Not available from Stripe
        WebsiteTraffic: 0, // Not available from Stripe
        LeadConversionRate: 0, // Not available from Stripe
        BurnRate: 0 // Not available from Stripe
      };

      return {
        success: true,
        data,
        metricsSynced: Object.keys(data).filter(k => data[k as KPIMetric] > 0).length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metricsSynced: 0
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Mock Stripe connection test
      return true;
    } catch {
      return false;
    }
  }
}

export class GoogleAnalyticsIntegration extends DataSourceIntegration {
  async sync(): Promise<IntegrationResult> {
    try {
      // Mock Google Analytics API call - replace with actual GA4 API
      // This would use the Google Analytics Data API v1
      
      const data: Record<KPIMetric, number> = {
        MRR: 0, // Not available from GA4
        ChurnRate: 0, // Not available from GA4
        CAC: 0, // Not available from GA4
        LTV: 0, // Not available from GA4
        DAU: 1250, // Mock daily active users
        WAU: 8500, // Mock weekly active users
        WebsiteTraffic: 45000, // Mock monthly visitors
        LeadConversionRate: 3.2, // Mock conversion rate
        BurnRate: 0 // Not available from GA4
      };

      return {
        success: true,
        data,
        metricsSynced: Object.keys(data).filter(k => data[k as KPIMetric] > 0).length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metricsSynced: 0
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Mock GA4 connection test
      return true;
    } catch {
      return false;
    }
  }
}

export class AirtableIntegration extends DataSourceIntegration {
  async sync(): Promise<IntegrationResult> {
    try {
      // Mock Airtable API call - replace with actual Airtable SDK
      // const Airtable = require('airtable');
      // const base = new Airtable({ apiKey: this.credentials }).base('your-base-id');

      // Mock data from Airtable
      const data: Record<KPIMetric, number> = {
        MRR: 12500,
        ChurnRate: 4.8,
        CAC: 180,
        LTV: 3200,
        DAU: 0, // Not available from Airtable
        WAU: 0, // Not available from Airtable
        WebsiteTraffic: 0, // Not available from Airtable
        LeadConversionRate: 0, // Not available from Airtable
        BurnRate: 8500
      };

      return {
        success: true,
        data,
        metricsSynced: Object.keys(data).filter(k => data[k as KPIMetric] > 0).length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metricsSynced: 0
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Mock Airtable connection test
      return true;
    } catch {
      return false;
    }
  }
}

export class GoogleSheetsIntegration extends DataSourceIntegration {
  async sync(): Promise<IntegrationResult> {
    try {
      // Mock Google Sheets API call - replace with actual Google Sheets API
      // This would use the Google Sheets API v4
      
      const data: Record<KPIMetric, number> = {
        MRR: 9800,
        ChurnRate: 6.1,
        CAC: 200,
        LTV: 2800,
        DAU: 0, // Not available from Sheets
        WAU: 0, // Not available from Sheets
        WebsiteTraffic: 0, // Not available from Sheets
        LeadConversionRate: 0, // Not available from Sheets
        BurnRate: 7200
      };

      return {
        success: true,
        data,
        metricsSynced: Object.keys(data).filter(k => data[k as KPIMetric] > 0).length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metricsSynced: 0
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Mock Google Sheets connection test
      return true;
    } catch {
      return false;
    }
  }
}

export class IntegrationFactory {
  static createIntegration(source: DataSource, credentials: string, userId: string): DataSourceIntegration {
    switch (source) {
      case 'Stripe':
        return new StripeIntegration(credentials, userId);
      case 'GoogleAnalytics':
        return new GoogleAnalyticsIntegration(credentials, userId);
      case 'Airtable':
        return new AirtableIntegration(credentials, userId);
      case 'GoogleSheets':
        return new GoogleSheetsIntegration(credentials, userId);
      default:
        throw new Error(`Unsupported data source: ${source}`);
    }
  }
}

export class KPISyncService {
  static async syncDataSource(sourceId: string): Promise<IntegrationResult> {
    try {
      // Get data source configuration
      const dataSource = await DatabaseService.getDataSource(sourceId);
      if (!dataSource) {
        throw new Error('Data source not found');
      }

      // Decrypt credentials
      const decryptedCredentials = DatabaseService.decryptCredentials(
        dataSource.credentials.encryptedData,
        dataSource.credentials.iv
      );

      // Create integration instance
      const integration = IntegrationFactory.createIntegration(
        dataSource.source,
        decryptedCredentials,
        dataSource.userId
      );

      // Test connection first
      const isConnected = await integration.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to data source');
      }

      // Perform sync
      const result = await integration.sync();
      
      if (result.success && result.data) {
        // Save KPI data to database
        for (const [metricName, value] of Object.entries(result.data)) {
          if (value > 0) {
            await DatabaseService.createKPI({
              userId: dataSource.userId,
              metricName: metricName as KPIMetric,
              source: dataSource.source,
              value,
              timestamp: new Date(),
              lastSyncedAt: new Date(),
              isManualOverride: false,
              status: 'active'
            });
          }
        }

        // Update data source last sync time
        await DatabaseService.updateDataSource(sourceId, {
          lastSyncAt: new Date()
        });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metricsSynced: 0
      };
    }
  }

  static async scheduleSyncJobs(): Promise<void> {
    // This would be called by a CRON job or worker queue
    const dataSources = Array.from(await DatabaseService.getDataSourcesByUser('all'));
    
    for (const dataSource of dataSources) {
      if (!dataSource.isActive) continue;

      const shouldSync = this.shouldSyncNow(dataSource);
      if (shouldSync) {
        // Create sync job
        await DatabaseService.createSyncJob({
          userId: dataSource.userId,
          sourceId: dataSource.id,
          status: 'pending',
          startedAt: new Date(),
          metricsSynced: 0
        });

        // In production, this would be queued for background processing
        // For MVP, we'll run it immediately
        await this.syncDataSource(dataSource.id);
      }
    }
  }

  private static shouldSyncNow(dataSource: any): boolean {
    if (!dataSource.lastSyncAt) return true;

    const now = new Date();
    const lastSync = dataSource.lastSyncAt;
    const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    switch (dataSource.syncFrequency) {
      case 'hourly':
        return hoursSinceLastSync >= 1;
      case 'daily':
        return hoursSinceLastSync >= 24;
      case 'weekly':
        return hoursSinceLastSync >= 168; // 7 days
      case 'manual':
        return false;
      default:
        return false;
    }
  }
} 