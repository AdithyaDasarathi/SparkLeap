import { NextRequest, NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/google";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      eventId,
      summary, 
      startISO, 
      endISO, 
      description,
      location,
      colorId,
      reminders,
      credentials 
    } = body;

    if (!eventId) {
      return NextResponse.json({ 
        error: 'Missing required field: eventId' 
      }, { status: 400 });
    }

    if (!credentials) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
    }

    const calendar = getCalendarClient(credentials);

    // Build event object
    const eventData: any = {};
    
    // Only include fields that are provided
    if (summary) eventData.summary = summary;
    if (startISO) eventData.start = { dateTime: startISO };
    if (endISO) eventData.end = { dateTime: endISO };
    if (description) eventData.description = description;
    if (location) eventData.location = location;
    if (colorId) eventData.colorId = colorId;
    if (reminders) eventData.reminders = reminders;

    const { data } = await calendar.events.update({
      calendarId: "primary",
      eventId,
      requestBody: eventData,
    });

    return NextResponse.json({ 
      success: true, 
      event: data,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Calendar update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}
