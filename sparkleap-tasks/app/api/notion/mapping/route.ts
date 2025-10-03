import { NextRequest, NextResponse } from 'next/server';
import { NotionDatabaseService } from '@/utils/database';
import { NotionPropertyMapping } from '@/types/notion';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { databaseId, mapping } = body as { databaseId: string; mapping: NotionPropertyMapping };
    if (!databaseId || !mapping) {
      return NextResponse.json({ error: 'databaseId and mapping are required' }, { status: 400 });
    }

    const updated = await NotionDatabaseService.update(databaseId, { propertyMapping: mapping });
    if (!updated) return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save mapping error:', error);
    return NextResponse.json({ error: 'Failed to save mapping' }, { status: 500 });
  }
}



