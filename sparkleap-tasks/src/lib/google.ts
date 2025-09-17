import { google } from "googleapis";

export function getOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET!,
    GOOGLE_REDIRECT_URI!
  );
  return oauth2Client;
}

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events", // read/write events
  "https://www.googleapis.com/auth/calendar.readonly", // read calendar list
  "https://www.googleapis.com/auth/userinfo.email", // user email
];

export const SHEETS_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly", // read Google Sheets
  "https://www.googleapis.com/auth/userinfo.email", // user email
];

export const COMBINED_SCOPES = [
  ...CALENDAR_SCOPES,
  ...SHEETS_SCOPES,
];

export function getCalendarClient(credentials: any) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(credentials);
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export function getSheetsClient(credentials: any) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(credentials);
  return google.sheets({ version: 'v4', auth: oauth2Client });
}
