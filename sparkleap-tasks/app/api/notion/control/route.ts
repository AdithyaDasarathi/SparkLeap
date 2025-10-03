import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, NotionDatabaseService, NotionTaskService } from '@/utils/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sourceId, databaseId, userId } = body as {
      action: 'stop' | 'delete-data';
      sourceId?: string;
      databaseId?: string;
      userId: string;
    };

    if (!action || !userId) return NextResponse.json({ error: 'action and userId required' }, { status: 400 });

    if (action === 'stop' && sourceId) {
      const ds = await DatabaseService.updateDataSource(sourceId, { isActive: false });
      return NextResponse.json({ success: !!ds });
    }

    if (action === 'delete-data') {
      if (databaseId) {
        await NotionTaskService.deleteByDatabase(databaseId);
        await NotionDatabaseService.update(databaseId, { selected: false });
        return NextResponse.json({ success: true });
      }
      // If no specific database provided, deactivate all for user
      const sources = await DatabaseService.getDataSourcesByUser(userId);
      for (const s of sources.filter(s => s.source === 'Notion')) {
        await DatabaseService.updateDataSource(s.id, { isActive: false });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Notion control error:', error);
    return NextResponse.json({ error: 'Failed to process control request' }, { status: 500 });
  }
}



