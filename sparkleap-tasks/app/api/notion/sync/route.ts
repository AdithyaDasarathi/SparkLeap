import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, NotionDatabaseService, NotionTaskService, NotionUserService } from '@/utils/database';
import { NotionTaskRecord } from '@/types/notion';

function toIso(date: string | Date | undefined): string | undefined {
  if (!date) return undefined;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, mode } = body as { sourceId: string; mode?: 'backfill' | 'incremental' };
    if (!sourceId) return NextResponse.json({ error: 'sourceId is required' }, { status: 400 });

    const ds = await DatabaseService.getDataSource(sourceId);
    if (!ds) return NextResponse.json({ error: 'Data source not found' }, { status: 404 });

    const decrypted = DatabaseService.decryptCredentials(ds.credentials.encryptedData, ds.credentials.iv);
    const { token } = JSON.parse(decrypted);
    if (!token) return NextResponse.json({ error: 'Missing Notion token' }, { status: 400 });

    const { Client } = require('@notionhq/client');
    const notion = new Client({ auth: token });

    const databases = await NotionDatabaseService.getByUser(ds.userId);
    const selectedDbs = databases.filter(d => d.selected);

    let total = 0;
    for (const db of selectedDbs) {
      let startCursor: string | undefined = undefined;
      let hasMore = true;

      const filter: any = {};
      if ((mode || 'incremental') === 'incremental' && db.lastEditedTimeCheckpoint) {
        filter.timestamp = 'last_edited_time';
        filter.last_edited_time = { after: db.lastEditedTimeCheckpoint } as any;
      }

      while (hasMore) {
        const resp = await notion.databases.query({
          database_id: db.id,
          start_cursor: startCursor,
          page_size: 100,
          filter: Object.keys(filter).length ? filter : undefined
        } as any);

        const tasks: NotionTaskRecord[] = [];
        for (const page of resp.results) {
          const props = page.properties || {};
          const m = db.propertyMapping || {};

          const titleProp = m.title && props[m.title];
          const title = Array.isArray(titleProp?.title) && titleProp.title.length > 0 ? titleProp.title[0].plain_text : undefined;

          const statusProp = m.status && props[m.status];
          const status = statusProp?.status?.name || statusProp?.select?.name;

          const assigneeProp = m.assignee && props[m.assignee];
          const assigneeIds = Array.isArray(assigneeProp?.people)
            ? assigneeProp.people.map((p: any) => p.id)
            : undefined;

          const dueProp = m.dueDate && props[m.dueDate];
          const dueAt = dueProp?.date?.end || dueProp?.date?.start;

          const completedAtProp = m.completedAt && props[m.completedAt];
          const completedAt = completedAtProp?.date?.start;

          const priorityProp = m.priority && props[m.priority];
          const priority = priorityProp?.select?.name;

          const estimateProp = m.estimate && props[m.estimate];
          const estimate = typeof estimateProp?.number === 'number' ? estimateProp.number : null;

          const tagsProp = m.tags && props[m.tags];
          const tags = Array.isArray(tagsProp?.multi_select) ? tagsProp.multi_select.map((t: any) => t.name) : undefined;

          const archived = !!page.archived;
          const lastEditedTime = page.last_edited_time;
          const createdAt = page.created_time;

          tasks.push({
            pageId: page.id,
            databaseId: db.id,
            userId: ds.userId,
            title,
            status,
            assigneeIds,
            createdAt: toIso(createdAt),
            dueAt: toIso(dueAt),
            completedAt: toIso(completedAt),
            priority,
            estimate: estimate ?? null,
            tags,
            lastEditedTime: toIso(lastEditedTime),
            archived,
            projectRelationIds: undefined,
            parentTaskId: null,
            firstInProgressAt: undefined
          });

          // upsert notion users if present
          if (Array.isArray(assigneeProp?.people)) {
            for (const p of assigneeProp.people) {
              await NotionUserService.upsert({
                notionUserId: p.id,
                userId: ds.userId,
                name: p.name,
                email: p.person?.email,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          }
        }

        total += await NotionTaskService.upsertMany(tasks);

        hasMore = resp.has_more;
        startCursor = resp.next_cursor || undefined;

        // checkpoint by latest last_edited_time in this page
        const latest = tasks
          .map(t => t.lastEditedTime)
          .filter(Boolean)
          .sort()
          .pop();
        if (latest) {
          await NotionDatabaseService.update(db.id, { lastEditedTimeCheckpoint: latest });
        }
      }
    }

    return NextResponse.json({ success: true, total });
  } catch (error) {
    console.error('Notion sync error:', error);
    return NextResponse.json({ error: 'Failed to sync Notion tasks' }, { status: 500 });
  }
}



