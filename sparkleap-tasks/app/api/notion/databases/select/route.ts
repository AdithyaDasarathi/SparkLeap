import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, NotionDatabaseService } from '@/utils/database';

// Select databases for syncing (store database IDs, not crawling content)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, userId, selections } = body as {
      sourceId: string;
      userId: string;
      selections: Array<{ id: string; name: string }>;
    };

    if (!sourceId || !userId || !Array.isArray(selections)) {
      return NextResponse.json({ error: 'sourceId, userId, selections required' }, { status: 400 });
    }

    // Verify source exists
    const ds = await DatabaseService.getDataSource(sourceId);
    if (!ds) return NextResponse.json({ error: 'Data source not found' }, { status: 404 });

    // Upsert lightweight database records
    for (const sel of selections) {
      await NotionDatabaseService.upsertDatabase({
        id: sel.id,
        userId,
        name: sel.name || 'Untitled',
        selected: true,
        properties: [],
        propertyMapping: undefined,
        lastEditedTimeCheckpoint: undefined
      });
    }

    return NextResponse.json({ success: true, count: selections.length });
  } catch (error) {
    console.error('Select Notion databases error:', error);
    return NextResponse.json({ error: 'Failed to save selections' }, { status: 500 });
  }
}


