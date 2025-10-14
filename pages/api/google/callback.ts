import { NextApiRequest, NextApiResponse } from 'next';
import { getOAuthClient } from '@/lib/google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, error, state } = req.query;
    const stateValue = (state as string) || 'calendar';

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      const redirectUrl = stateValue === 'sheets' ? '/' : '/calendar';
      return res.redirect(
        `${process.env.NEXTAUTH_URL}${redirectUrl}?auth=error&message=${encodeURIComponent(error as string)}`
      );
    }

    // Check for authorization code
    if (!code) {
      const redirectUrl = stateValue === 'sheets' ? '/' : '/calendar';
      return res.redirect(
        `${process.env.NEXTAUTH_URL}${redirectUrl}?auth=error&message=No authorization code`
      );
    }

    // Exchange code for tokens
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code as string);

    // Validate tokens
    if (!tokens.access_token) {
      const redirectUrl = stateValue === 'sheets' ? '/' : '/calendar';
      return res.redirect(
        `${process.env.NEXTAUTH_URL}${redirectUrl}?auth=error&message=Failed to get access token`
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

    // Redirect based on state
    const redirectUrl = stateValue === 'sheets' ? '/' : '/calendar';
    return res.redirect(
      `${process.env.NEXTAUTH_URL}${redirectUrl}?auth=success&credentials=${encodeURIComponent(JSON.stringify(credentials))}&source=${stateValue}`
    );

  } catch (error) {
    console.error('Google callback error:', error);
    const stateValue = (req.query.state as string) || 'calendar';
    const redirectUrl = stateValue === 'sheets' ? '/' : '/calendar';
    return res.redirect(
      `${process.env.NEXTAUTH_URL}${redirectUrl}?auth=error&message=${encodeURIComponent('Authentication failed')}`
    );
  }
}
