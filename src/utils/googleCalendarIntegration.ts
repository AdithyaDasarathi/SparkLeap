import { google } from 'googleapis';
import { Task } from '../types/task';
import { getOAuthClient, getCalendarClient } from '../lib/google';

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export class GoogleCalendarIntegration {
  private oauth2Client: any;
  private calendar: any;

  constructor(credentials: any) {
    this.oauth2Client = getOAuthClient();
    this.oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.calendar.calendarList.list();
      return true;
    } catch (error) {
      console.error('Google Calendar connection test failed:', error);
      return false;
    }
  }

  async getCalendars() {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
      throw error;
    }
  }

  async createEvent(calendarId: string, event: GoogleCalendarEvent) {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        resource: event,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  // New method using the API endpoint
  async createEventViaAPI(event: GoogleCalendarEvent, credentials: any) {
    try {
      const response = await fetch('/api/calendar/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: event.summary,
          startISO: event.start.dateTime,
          endISO: event.end.dateTime,
          description: event.description,
          colorId: event.colorId,
          reminders: event.reminders,
          credentials
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.event;
    } catch (error) {
      console.error('Failed to create calendar event via API:', error);
      throw error;
    }
  }

  async updateEvent(calendarId: string, eventId: string, event: GoogleCalendarEvent) {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: event,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(calendarId: string, eventId: string) {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });
      return true;
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  }

  async getEvents(calendarId: string, timeMin?: string, timeMax?: string) {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      throw error;
    }
  }

  // Convert Task to Google Calendar Event
  taskToCalendarEvent(task: Task): GoogleCalendarEvent {
    // Ensure dueDate is a proper Date object
    const startDate = task.dueDate ? new Date(task.dueDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1); // Default 1-hour duration

    // Set specific time if dueTime is provided
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      startDate.setHours(hours, minutes, 0, 0);
      endDate.setHours(hours + 1, minutes, 0, 0);
    }

    // Choose color based on priority
    const getColorId = (priority: string) => {
      switch (priority) {
        case 'High': return '11'; // Red
        case 'Medium': return '5'; // Yellow
        case 'Low': return '10'; // Green
        default: return '1'; // Default blue
      }
    };

    return {
      summary: task.title,
      description: `Priority: ${task.priority}\nCategory: ${task.category}\nStatus: ${task.completed ? 'Completed' : 'Pending'}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      colorId: getColorId(task.priority),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 60 },
        ],
      },
    };
  }

  // Sync all tasks to Google Calendar
  async syncTasksToCalendar(tasks: Task[], calendarId: string = 'primary') {
    try {
      const results = {
        created: 0,
        updated: 0,
        errors: 0,
        events: [] as any[],
        errorDetails: [] as string[],
      };

      for (const task of tasks) {
        if (!task.dueDate) continue; // Skip tasks without due dates

        try {
          const event = this.taskToCalendarEvent(task);
          
          // Check if event already exists (you might want to store event IDs)
          const existingEvents = await this.getEvents(calendarId);
          const existingEvent = existingEvents.find(e => 
            e.summary === task.title && 
            e.start?.dateTime && 
            new Date(e.start.dateTime).toDateString() === task.dueDate?.toDateString()
          );

          if (existingEvent) {
            // Update existing event
            await this.updateEvent(calendarId, existingEvent.id!, event);
            results.updated++;
          } else {
            // Create new event
            const createdEvent = await this.createEvent(calendarId, event);
            results.events.push(createdEvent);
            results.created++;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to sync task "${task.title}":`, error);
          results.errors++;
          results.errorDetails.push(`${task.title}: ${message}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to sync tasks to calendar:', error);
      throw error;
    }
  }

  // Sync from Google Calendar to tasks (if needed)
  async syncCalendarToTasks(calendarId: string = 'primary') {
    try {
      const events = await this.getEvents(calendarId);
      const tasks: Task[] = [];

      for (const event of events) {
        if (!event.start?.dateTime) continue;

        const task: Task = {
          id: `google-${event.id}`,
          title: event.summary || 'Untitled Event',
          dueDate: new Date(event.start.dateTime),
          dueTime: new Date(event.start.dateTime).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          category: 'General',
          priority: this.getPriorityFromColor(event.colorId),
          completed: false,
          createdAt: new Date(),
        };

        tasks.push(task);
      }

      return tasks;
    } catch (error) {
      console.error('Failed to sync calendar to tasks:', error);
      throw error;
    }
  }

  private getPriorityFromColor(colorId?: string): 'High' | 'Medium' | 'Low' {
    switch (colorId) {
      case '11': return 'High'; // Red
      case '5': return 'Medium'; // Yellow
      case '10': return 'Low'; // Green
      default: return 'Medium';
    }
  }
}
