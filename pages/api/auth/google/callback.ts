import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, error, state } = req.query;

    console.log('🔄 Google OAuth callback received:', { code: !!code, error, state });

    if (error) {
      console.error('❌ Google OAuth error:', error);
      return res.redirect(`/login?error=${encodeURIComponent(error as string)}`);
    }

    if (!code) {
      console.error('❌ No authorization code received');
      return res.redirect('/login?error=no_code');
    }

    // Redirect to the callback page with the code
    const callbackPageUrl = new URL('/auth/google/callback', `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`);
    callbackPageUrl.searchParams.append('code', code as string);
    if (state) {
      callbackPageUrl.searchParams.append('state', state as string);
    }

    console.log('🔗 Redirecting to callback page:', callbackPageUrl.toString());

    return res.redirect(callbackPageUrl.toString());
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    return res.redirect('/login?error=callback_failed');
  }
}
