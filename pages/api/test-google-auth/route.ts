import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test Google auth endpoint called');
    
    return NextResponse.json({
      success: true,
      message: 'Google auth test endpoint is working',
      timestamp: new Date().toISOString(),
      url: request.url
    });
    
  } catch (error) {
    console.error('❌ Test Google auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
