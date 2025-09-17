import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../src/utils/database';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    // Get all data sources for the user
    const dataSources = await DatabaseService.getDataSourcesByUser(userId);
    
    // Get sync status
    const syncStatus = await DatabaseService.getSyncStatus(userId);

    // Check file storage
    const DATA_DIR = path.join(process.cwd(), 'data');
    const DATA_SOURCES_FILE = path.join(DATA_DIR, 'datasources.json');
    
    let fileInfo = {
      exists: false,
      size: 0,
      content: null
    };

    try {
      if (fs.existsSync(DATA_SOURCES_FILE)) {
        const stats = fs.statSync(DATA_SOURCES_FILE);
        const content = fs.readFileSync(DATA_SOURCES_FILE, 'utf8');
        fileInfo = {
          exists: true,
          size: stats.size,
          content: JSON.parse(content)
        };
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }

    return NextResponse.json({
      userId,
      dataSources: dataSources.map(ds => ({
        id: ds.id,
        source: ds.source,
        isActive: ds.isActive,
        syncFrequency: ds.syncFrequency,
        createdAt: ds.createdAt,
        lastSyncAt: ds.lastSyncAt
      })),
      syncStatus,
      totalDataSources: dataSources.length,
      notionDataSources: dataSources.filter(ds => ds.source === 'Notion').length,
      fileStorage: {
        dataDir: DATA_DIR,
        dataSourcesFile: DATA_SOURCES_FILE,
        fileExists: fileInfo.exists,
        fileSize: fileInfo.size,
        fileContent: fileInfo.content
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
} 