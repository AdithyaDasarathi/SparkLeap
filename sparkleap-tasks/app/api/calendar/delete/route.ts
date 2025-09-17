import { NextRequest, NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/google";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const credentialsParam = searchParams.get('credentials');

    if (!eventId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: eventId' 
      }, { status: 400 });
    }

    if (!credentialsParam) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
    }

    const credentials = JSON.parse(decodeURIComponent(credentialsParam));
    const calendar = getCalendarClient(credentials);

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Calendar delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}
