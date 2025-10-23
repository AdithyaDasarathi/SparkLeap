import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Checking Google OAuth setup...');
    
    const envCheck = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: !!process.env.GOOGLE_REDIRECT_URI,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET
    };
    
    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    console.log('🔧 Environment check:', envCheck);
    console.log('❌ Missing variables:', missingVars);
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      missingVariables: missingVars,
      recommendations: missingVars.length > 0 ? [
        'Add missing environment variables to your .env file',
        'Restart your development server after adding variables',
        'Make sure .env file is in the project root'
      ] : [
        'All required environment variables are present',
        'Google OAuth should work correctly'
      ]
    });
    
  } catch (error) {
    console.error('❌ Google OAuth setup check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
