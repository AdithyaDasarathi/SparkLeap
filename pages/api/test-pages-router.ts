import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🧪 Pages Router test endpoint called');
    
    return res.status(200).json({
      success: true,
      message: 'Pages Router API endpoint is working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
    
  } catch (error) {
    console.error('❌ Pages Router test error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
