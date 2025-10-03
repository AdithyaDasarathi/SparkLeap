import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/utils/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');
    const databaseId = searchParams.get('databaseId');

    if (!sourceId || !databaseId) {
      return NextResponse.json({ error: 'sourceId and databaseId are required' }, { status: 400 });
    }

    const ds = await DatabaseService.getDataSource(sourceId);
    if (!ds) return NextResponse.json({ error: 'Data source not found' }, { status: 404 });

    const decrypted = DatabaseService.decryptCredentials(ds.credentials.encryptedData, ds.credentials.iv);
    const { token } = JSON.parse(decrypted);
    if (!token) return NextResponse.json({ error: 'Missing Notion token' }, { status: 400 });

    const { Client } = require('@notionhq/client');
    const notion = new Client({ auth: token });
    const meta = await notion.databases.retrieve({ database_id: databaseId });

    const properties = Object.entries(meta.properties || {}).map(([name, def]: [string, any]) => ({
      name,
      type: def?.type || 'unknown',
      id: def?.id
    }));

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Fetch Notion schema error:', error);
    return NextResponse.json({ error: 'Failed to fetch schema' }, { status: 500 });
  }
}


