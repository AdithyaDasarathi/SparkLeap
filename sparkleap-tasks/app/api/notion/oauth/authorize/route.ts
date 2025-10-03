import { NextRequest, NextResponse } from 'next/server';

// Redirects the user to Notion OAuth consent screen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: 'Notion OAuth not configured' }, { status: 500 });
    }

    const state = Buffer.from(JSON.stringify({ userId, t: Date.now() })).toString('base64url');
    const url = new URL('https://api.notion.com/v1/oauth/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('owner', 'user');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);

    return NextResponse.redirect(url.toString());
  } catch (error) {
    console.error('Notion authorize error:', error);
    return NextResponse.json({ error: 'Failed to start Notion OAuth' }, { status: 500 });
  }
}


