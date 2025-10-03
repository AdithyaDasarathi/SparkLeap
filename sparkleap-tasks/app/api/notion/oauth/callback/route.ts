import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/utils/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    const { userId } = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as { userId: string };

    const clientId = process.env.NOTION_CLIENT_ID!;
    const clientSecret = process.env.NOTION_CLIENT_SECRET!;
    const redirectUri = process.env.NOTION_REDIRECT_URI!;

    const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Notion token exchange failed:', err);
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string;

    const credentials = JSON.stringify({ token: accessToken });
    const encrypted = DatabaseService.encryptCredentials(credentials);

    const ds = await DatabaseService.createDataSource({
      userId,
      source: 'Notion',
      credentials: encrypted,
      isActive: true,
      syncFrequency: '5min',
      lastSyncAt: null as any
    } as any);

    // Redirect to a UI page to select databases
    const uiUrl = new URL('/kpi', request.nextUrl.origin);
    uiUrl.searchParams.set('notionSourceId', ds.id);
    return NextResponse.redirect(uiUrl.toString());
  } catch (error) {
    console.error('Notion OAuth callback error:', error);
    return NextResponse.json({ error: 'Failed to complete Notion OAuth' }, { status: 500 });
  }
}


