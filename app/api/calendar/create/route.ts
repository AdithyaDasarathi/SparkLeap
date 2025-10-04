import { NextRequest, NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/google";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      summary, 
      startISO, 
      endISO, 
      description,
      location,
      colorId,
      reminders,
      credentials 
    } = body;

    if (!summary || !startISO || !endISO) {
      return NextResponse.json({ 
        error: 'Missing required fields: summary, startISO, endISO' 
      }, { status: 400 });
    }

    if (!credentials) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
    }

    // TODO: In production, load tokens from database using user ID
    // const tokens = await getUserTokens(userId);
    // For now, we use the credentials from the request

    const calendar = getCalendarClient(credentials);

    // Build event object
    const eventData: any = {
      summary,
      start: { dateTime: startISO },
      end: { dateTime: endISO },
    };

    // Add optional fields if provided
    if (description) eventData.description = description;
    if (location) eventData.location = location;
    if (colorId) eventData.colorId = colorId;
    if (reminders) eventData.reminders = reminders;

    const { data } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventData,
    });

    return NextResponse.json({ 
      success: true, 
      event: data,
      eventId: data.id,
      message: 'Event created successfully'
    });

  } catch (error) {
    console.error('Calendar create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}
