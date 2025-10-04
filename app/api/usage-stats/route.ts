import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '../../../src/utils/rateLimiter';

export async function GET(request: NextRequest) {
  try {
    // Simple auth check - in production, add proper authentication
    const adminKey = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_API_KEY || 'dev-admin-key';
    
    if (adminKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = rateLimiter.getStats();
    
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: stats.totalUsers,
        totalRequests: stats.totalRequests,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return NextResponse.json({ 
      error: 'Failed to get usage stats' 
    }, { status: 500 });
  }
}
