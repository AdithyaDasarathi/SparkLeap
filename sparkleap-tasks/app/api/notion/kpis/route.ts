import { NextRequest, NextResponse } from 'next/server';
import { NotionTaskService, ExecutionSnapshotService } from '@/utils/database';

function startOfWeekUtc(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Monday as start
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    const scopeDbId = searchParams.get('databaseId');

    const tasks = scopeDbId
      ? await NotionTaskService.getByDatabase(scopeDbId)
      : await NotionTaskService.getByUser(userId);

    const now = new Date();
    const weekStart = startOfWeekUtc(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    const completedThisWeek = tasks.filter(t => t.completedAt && new Date(t.completedAt) >= new Date(weekStart) && new Date(t.completedAt) < weekEnd);

    const onTime = completedThisWeek.filter(t => t.dueAt ? new Date(t.completedAt!) <= new Date(t.dueAt) : true);
    const onTimeRate = completedThisWeek.length ? onTime.length / completedThisWeek.length : 0;

    const cycleTimesDays = completedThisWeek
      .filter(t => t.createdAt)
      .map(t => (new Date(t.completedAt!).getTime() - new Date(t.createdAt!).getTime()) / (1000 * 60 * 60 * 24))
      .sort((a, b) => a - b);
    const medianCycleTimeDays = cycleTimesDays.length
      ? cycleTimesDays[Math.floor(cycleTimesDays.length / 2)]
      : null;

    // WIP: statuses not completed per mapping (fallback: not completedAt)
    const wipCount = tasks.filter(t => !t.completedAt && !t.archived).length;

    // Overdue open this week
    const overdueOpen = tasks.filter(t => !t.completedAt && t.dueAt && new Date(t.dueAt) < now).length;

    // Focus breakdown by tag
    const tagCounts: Record<string, number> = {};
    for (const t of completedThisWeek) {
      for (const tag of t.tags || []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const snapshot = await ExecutionSnapshotService.upsert({
      userId,
      weekStart,
      completedTasks: completedThisWeek.length,
      onTimeRate,
      medianCycleTimeDays,
      wipCount,
      overdueOpen,
      focusBreakdown: tagCounts
    });

    return NextResponse.json({
      completedTasks: completedThisWeek.length,
      onTimeRate,
      medianCycleTimeDays,
      wipCount,
      overdueOpen,
      focusBreakdown: tagCounts,
      weekStart: snapshot.weekStart
    });
  } catch (error) {
    console.error('Notion KPI error:', error);
    return NextResponse.json({ error: 'Failed to compute KPIs' }, { status: 500 });
  }
}



