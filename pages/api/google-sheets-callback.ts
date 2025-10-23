import { NextApiRequest, NextApiResponse } from 'next';
import { getOAuthClient } from '@/lib/google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, error, state } = req.query;
    console.log('🔗 Google Sheets callback received:', { hasCode: !!code, error, state });

    // Handle OAuth errors
    if (error) {
      console.error('❌ Google OAuth error:', error);
      return res.redirect(
        `${process.env.NEXTAUTH_URL}/?auth=error&message=${encodeURIComponent(error as string)}`
      );
    }

    // Check for authorization code
    if (!code) {
      console.error('❌ No authorization code received');
      return res.redirect(
        `${process.env.NEXTAUTH_URL}/?auth=error&message=No authorization code`
      );
    }

    // Exchange code for tokens
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code as string);

    // Validate tokens
    if (!tokens.access_token) {
      console.error('❌ No access token received');
      return res.redirect(
        `${process.env.NEXTAUTH_URL}/?auth=error&message=Failed to get access token`
      );
    }

    // Prepare credentials object
    const credentials = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope,
      tokenType: tokens.token_type,
    };

    console.log('✅ Google Sheets OAuth successful, redirecting with credentials');
    
    // Redirect back to the main page with credentials
    return res.redirect(
      `${process.env.NEXTAUTH_URL}/?auth=success&credentials=${encodeURIComponent(JSON.stringify(credentials))}&source=sheets`
    );

  } catch (error) {
    console.error('❌ Google Sheets callback error:', error);
    return res.redirect(
      `${process.env.NEXTAUTH_URL}/?auth=error&message=${encodeURIComponent('Authentication failed')}`
    );
  }
}
