import { NextApiRequest, NextApiResponse } from 'next';
import { getOAuthClient, COMBINED_SCOPES } from '@/lib/google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔗 Google Sheets auth endpoint called (Pages Router)');
    
    const oauth2Client = getOAuthClient();
    
    // Use the correct redirect URI for sheets
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/google-sheets-callback`;
    
    console.log('🔗 Using redirect URI:', redirectUri);
    oauth2Client.redirectUri = redirectUri;
    
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: COMBINED_SCOPES,
      state: "sheets"
    });
    
    console.log('🔗 Generated auth URL:', url);
    return res.redirect(url);
    
  } catch (error) {
    console.error('❌ Google Sheets auth error:', error);
    return res.status(500).json({
      error: 'Failed to generate auth URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
