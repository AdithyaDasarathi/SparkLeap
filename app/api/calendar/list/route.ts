import { NextRequest, NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const credentialsParam = searchParams.get('credentials');
    
    if (!credentialsParam) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
    }

    // Parse credentials from request
    const credentials = JSON.parse(decodeURIComponent(credentialsParam));
    
    // TODO: In production, load tokens from database using user ID
    // const tokens = await getUserTokens(userId);
    // For now, we use the credentials from the request
    
    const calendar = getCalendarClient(credentials);

    const now = new Date().toISOString();
    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: now,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 10,
    });

    return NextResponse.json({ 
      success: true, 
      events: data.items ?? [],
      count: data.items?.length ?? 0
    });

  } catch (error) {
    console.error('Calendar list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
