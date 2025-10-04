import { NextRequest, NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const credentialsParam = searchParams.get('credentials');
    const calendarId = searchParams.get('calendarId') || 'primary';
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    
    if (!credentialsParam) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
    }

    // Parse credentials from request
    const credentials = JSON.parse(decodeURIComponent(credentialsParam));
    const calendar = getCalendarClient(credentials);

    // Build query parameters
    const queryParams: any = {
      calendarId,
      singleEvents: true,
      orderBy: "startTime",
      maxResults,
    };

    if (timeMin) queryParams.timeMin = timeMin;
    if (timeMax) queryParams.timeMax = timeMax;

    const { data } = await calendar.events.list(queryParams);

    return NextResponse.json({ 
      success: true, 
      events: data.items ?? [],
      count: data.items?.length ?? 0,
      nextPageToken: data.nextPageToken,
      calendarId
    });

  } catch (error) {
    console.error('Calendar events error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
