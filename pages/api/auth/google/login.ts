import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Google OAuth credentials are configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/google/callback`;

    if (!clientId) {
      return res.status(500).json({ 
        error: 'Google OAuth not configured',
        message: 'Please set GOOGLE_CLIENT_ID in environment variables'
      });
    }

    // Check if this is for Google Sheets integration
    const intent = req.query.intent as string;
    
    // Google OAuth scopes - include Sheets scope if needed
    let scopes = [
      'openid',
      'email',
      'profile'
    ];
    
    if (intent === 'sheets') {
      scopes.push('https://www.googleapis.com/auth/spreadsheets.readonly');
    }
    
    const scopeString = scopes.join(' ');

    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', clientId);
    googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', scopeString);
    
    googleAuthUrl.searchParams.append('access_type', 'offline');
    googleAuthUrl.searchParams.append('prompt', 'consent');
    
    // Pass the intent through the state parameter
    const state = intent ? `${intent}_${Math.random().toString(36).substring(2, 15)}` : Math.random().toString(36).substring(2, 15);
    googleAuthUrl.searchParams.append('state', state);

    console.log('🔗 Redirecting to Google OAuth:', googleAuthUrl.toString());

    // Redirect to Google OAuth
    return res.redirect(googleAuthUrl.toString());
  } catch (error) {
    console.error('Error initiating Google login:', error);
    return res.status(500).json({ 
      error: 'Failed to initiate login',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
