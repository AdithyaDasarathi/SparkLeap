import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if environment variables are loaded
    const envCheck = {
      NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_OPENAI_API_BASE_URL: process.env.NEXT_PUBLIC_OPENAI_API_BASE_URL || 'NOT SET',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? 'SET' : 'NOT SET',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET'
    };

    return NextResponse.json({
      message: 'Environment variables check',
      variables: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check environment variables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
