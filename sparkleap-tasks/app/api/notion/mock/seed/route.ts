import { NextRequest, NextResponse } from 'next/server';
import { NotionTaskService, NotionDatabaseService } from '@/utils/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'demo-user', databaseId = 'mock-db-1', tasksCount = 12 } = body || {};

    await NotionDatabaseService.upsertDatabase({
      id: databaseId,
      userId,
      name: 'Mock Tasks',
      selected: true,
      properties: [],
      propertyMapping: {
        title: 'Name',
        status: 'Status',
        assignee: 'Assignee',
        dueDate: 'Due',
        completedAt: 'Completed',
        priority: 'Priority',
        estimate: 'Estimate',
        tags: 'Tags',
        activeStatusValues: ['In Progress', 'Blocked'],
        completedStatusValues: ['Done'],
        backlogStatusValues: ['Todo']
      }
    });

    const now = Date.now();
    const statuses = ['Todo', 'In Progress', 'Blocked', 'Done'];
    const tags = ['Product', 'Growth', 'Infra'];
    const priorities = ['Low', 'Medium', 'High'];

    const mockTasks = Array.from({ length: tasksCount }).map((_, i) => {
      const created = new Date(now - (i + 10) * 86400000);
      const due = new Date(created.getTime() + (2 + (i % 5)) * 86400000);
      const isDone = i % 3 === 0;
      const completed = isDone ? new Date(created.getTime() + (1 + (i % 4)) * 86400000) : undefined;
      const st = isDone ? 'Done' : statuses[i % statuses.length];
      return {
        pageId: `mock-page-${i + 1}`,
        databaseId,
        userId,
        title: `Mock Task #${i + 1}`,
        status: st,
        assigneeIds: [],
        createdAt: created.toISOString(),
        dueAt: due.toISOString(),
        completedAt: completed?.toISOString(),
        priority: priorities[i % priorities.length],
        estimate: (i % 5) + 1,
        tags: [tags[i % tags.length]],
        lastEditedTime: new Date(created.getTime() + 3600000).toISOString(),
        archived: false,
        projectRelationIds: [],
        parentTaskId: null
      };
    });

    await NotionTaskService.upsertMany(mockTasks as any);
    return NextResponse.json({ success: true, seeded: mockTasks.length, databaseId });
  } catch (error) {
    console.error('Mock seed error:', error);
    return NextResponse.json({ error: 'Failed to seed mock data' }, { status: 500 });
  }
}


