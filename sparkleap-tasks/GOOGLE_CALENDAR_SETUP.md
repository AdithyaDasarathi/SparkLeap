# Google Calendar Integration Setup Guide

This guide will help you set up the Google Calendar integration to sync your tasks with Google Calendar.

## 🚀 Features

- **OAuth2 Authentication**: Secure connection to Google Calendar using OAuth2
- **Bidirectional Sync**: Sync tasks to Google Calendar and import events as tasks
- **Priority Color Coding**: Tasks are color-coded based on priority (High=Red, Medium=Yellow, Low=Green)
- **Smart Event Management**: Automatically creates, updates, and manages calendar events
- **Multiple Calendar Support**: Choose which Google Calendar to sync with

## 📋 Prerequisites

1. A Google Cloud Project
2. Google Calendar API enabled
3. OAuth2 credentials configured
4. Tasks with due dates in your SparkLeap app

## 🔧 Setup Instructions

### Step 1: Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project (or create a new one)
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### Step 2: Update OAuth2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Edit your existing OAuth2 client ID
3. Add the Calendar scope to your existing scopes:
   - `https://www.googleapis.com/auth/calendar`
4. Make sure your redirect URI is still configured:
   - `http://localhost:3000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)

### Step 3: Environment Variables

Your existing `.env` file should already have the required variables:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXTAUTH_URL=http://localhost:3000
```

## 🎯 How to Use

### 1. Connect to Google Calendar

1. Navigate to the Calendar page (`/calendar`)
2. Click "Connect Google Calendar" in the sync section
3. Complete the OAuth2 flow in the popup window
4. Select which calendar to sync with (defaults to your primary calendar)

### 2. Sync Tasks

1. Once connected, click "Sync Tasks" to sync all tasks with due dates
2. Tasks will appear as events in your Google Calendar
3. Events are color-coded based on task priority:
   - 🔴 **High Priority**: Red events
   - 🟡 **Medium Priority**: Yellow events  
   - 🟢 **Low Priority**: Green events

### 3. Event Details

Each synced event includes:
- **Title**: Task title
- **Description**: Priority, category, and status
- **Time**: Based on task due date and time
- **Reminders**: 15-minute popup and 1-hour email reminders
- **Color**: Based on task priority

## 🔄 Sync Behavior

### Tasks → Google Calendar
- Only tasks with due dates are synced
- Completed tasks are not synced
- Events are created with 1-hour duration by default
- If a task already exists as an event, it will be updated

### Google Calendar → Tasks (Future Feature)
- Import events from Google Calendar as tasks
- Maintain priority based on event color
- Sync event times to task due dates

## 🛠️ Troubleshooting

### Common Issues

1. **"Authorization failed"**
   - Check that Google Calendar API is enabled
   - Verify OAuth2 credentials are correct
   - Ensure redirect URI matches exactly

2. **"Cannot access calendar"**
   - Make sure the calendar is shared with your Google account
   - Check that the calendar ID is correct
   - Verify OAuth2 scopes include calendar access

3. **"Sync failed"**
   - Check that tasks have due dates
   - Verify internet connection
   - Check browser console for detailed error messages

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages and API responses.

## 🔒 Security Notes

- OAuth2 tokens are stored locally in your browser
- Calendar access is read/write - be careful with sensitive calendars
- Tokens are automatically refreshed when needed
- You can disconnect at any time to revoke access

## 📱 Mobile Support

The Google Calendar sync works on mobile devices through the web interface. Synced events will appear in your mobile Google Calendar app.

## 🆘 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Google Cloud project settings
3. Ensure all environment variables are set correctly
4. Try disconnecting and reconnecting to Google Calendar

---

**Note**: This integration requires an active internet connection and valid Google account with Calendar access.
