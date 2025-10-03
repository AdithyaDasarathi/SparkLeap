import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/utils/database';
import type { SearchResponse } from '@notionhq/client/build/src/api-endpoints';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId is required' }, { status: 400 });
    }

    const dataSource = await DatabaseService.getDataSource(sourceId);
    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    const decrypted = DatabaseService.decryptCredentials(
      dataSource.credentials.encryptedData,
      dataSource.credentials.iv
    );
    const { token } = JSON.parse(decrypted);

    if (!token) {
      return NextResponse.json({ error: 'Missing Notion token' }, { status: 400 });
    }

    const { Client } = require('@notionhq/client');
    const notion = new Client({ auth: token });

    // List only pages where type is database via search endpoint
    const results: any[] = [];
    let hasMore = true;
    let cursor: string | undefined = undefined;
    while (hasMore) {
      const resp: SearchResponse = await notion.search({
        query: '',
        filter: { value: 'database', property: 'object' },
        start_cursor: cursor,
        page_size: 50
      } as any);
      results.push(...resp.results);
      hasMore = resp.has_more;
      cursor = resp.next_cursor || undefined;
    }

    // Return lightweight info; we are not crawling page content
    const databases = results.map((r: any) => ({
      id: r.id,
      title: r.title?.[0]?.plain_text || r.title || 'Untitled',
      last_edited_time: r.last_edited_time
    }));

    return NextResponse.json({ databases });
  } catch (error) {
    console.error('List Notion databases error:', error);
    return NextResponse.json({ error: 'Failed to list Notion databases' }, { status: 500 });
  }
}


