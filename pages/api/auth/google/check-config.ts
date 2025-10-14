import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Check if OAuth is properly configured (not placeholder values)
    const isConfigured = !!(
      clientId && 
      clientSecret && 
      clientId !== 'your_google_client_id_here' &&
      clientSecret !== 'your_google_client_secret_here' &&
      clientId.includes('googleusercontent.com')
    );

    return res.status(200).json({
      configured: isConfigured,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      isPlaceholder: clientId === 'your_google_client_id_here'
    });
  } catch (error) {
    return res.status(500).json({
      configured: false,
      error: 'Failed to check configuration'
    });
  }
}
