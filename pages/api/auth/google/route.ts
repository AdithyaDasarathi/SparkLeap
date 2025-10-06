import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getOAuthClient, COMBINED_SCOPES } from '@/lib/google';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'authorize') {
      // Step 1: Generate authorization URL
      const oauth2Client = getOAuthClient();

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: COMBINED_SCOPES,
        prompt: 'consent' // Force consent to get refresh token
      });

      return NextResponse.json({ authUrl });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId, spreadsheetId, range } = body;

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    // Step 2: Exchange authorization code for tokens
    const oauth2Client = getOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 400 });
    }

    // Set credentials and test the connection
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Test spreadsheet access if spreadsheetId is provided
    let spreadsheetInfo = null;
    if (spreadsheetId) {
      try {
        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
        const response = await sheets.spreadsheets.get({
          spreadsheetId,
        });
        
        spreadsheetInfo = {
          title: response.data.properties?.title,
          sheets: response.data.sheets?.map(sheet => ({
            title: sheet.properties?.title,
            sheetId: sheet.properties?.sheetId
          }))
        };
      } catch (error) {
        return NextResponse.json({ 
          error: 'Cannot access the specified spreadsheet. Please check the spreadsheet ID and sharing permissions.' 
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      },
      userInfo: {
        email: userInfo.data.email,
        name: userInfo.data.name
      },
      spreadsheetInfo
    });

  } catch (error) {
    console.error('Google OAuth token exchange error:', error);
    return NextResponse.json(
      { error: 'Failed to exchange authorization code for tokens' },
      { status: 500 }
    );
  }
}