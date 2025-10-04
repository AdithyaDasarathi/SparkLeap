import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('🔄 Google OAuth callback received:', { code: !!code, error, state });

    if (error) {
      console.error('❌ Google OAuth error:', error);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code) {
      console.error('❌ No authorization code received');
      return NextResponse.redirect(new URL('/login?error=no_code', request.url));
    }

    // Redirect to the callback page with the code
    const callbackPageUrl = new URL('/auth/google/callback', request.url);
    callbackPageUrl.searchParams.append('code', code);
    if (state) {
      callbackPageUrl.searchParams.append('state', state);
    }

    console.log('🔗 Redirecting to callback page:', callbackPageUrl.toString());

    return NextResponse.redirect(callbackPageUrl);
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
  }
}
