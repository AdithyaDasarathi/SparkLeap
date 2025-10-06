import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarIntegration } from '@/utils/googleCalendarIntegration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, credentials, tasks, calendarId } = body;

    if (!credentials || !credentials.accessToken) {
      return NextResponse.json({ error: 'Google Calendar credentials required' }, { status: 400 });
    }

    const calendarIntegration = new GoogleCalendarIntegration(credentials);

    switch (action) {
      case 'test-connection':
        const isConnected = await calendarIntegration.testConnection();
        return NextResponse.json({ connected: isConnected });

      case 'get-calendars':
        const calendars = await calendarIntegration.getCalendars();
        return NextResponse.json({ calendars });

      case 'sync-tasks':
        if (!tasks || !Array.isArray(tasks)) {
          return NextResponse.json({ error: 'Tasks array required' }, { status: 400 });
        }
        const syncResult = await calendarIntegration.syncTasksToCalendar(tasks, calendarId);
        return NextResponse.json({ success: true, result: syncResult });

      case 'get-events':
        const events = await calendarIntegration.getEvents(calendarId || 'primary');
        return NextResponse.json({ events });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Google Calendar API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
