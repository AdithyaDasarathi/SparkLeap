import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Authorization code is required' 
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        success: false, 
        error: 'Google OAuth credentials not configured' 
      });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.json();
      console.error('Token exchange error:', tokenError);
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to exchange authorization code',
        details: tokenError
      });
    }

    const tokens = await tokenResponse.json();

    // Get user information from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const userError = await userResponse.json();
      console.error('User info error:', userError);
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to get user information',
        details: userError
      });
    }

    const userInfo = await userResponse.json();

    // Create user session data
    const user = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      verified_email: userInfo.verified_email,
      loginAt: new Date().toISOString(),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    };

    console.log('✅ Google login successful for:', userInfo.email);

    return res.status(200).json({
      success: true,
      user: user,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Google auth exchange error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
