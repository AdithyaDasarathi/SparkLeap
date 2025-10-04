import { NextResponse } from 'next/server';

export async function GET() {
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

    return NextResponse.json({
      configured: isConfigured,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      isPlaceholder: clientId === 'your_google_client_id_here'
    });
  } catch (error) {
    return NextResponse.json({
      configured: false,
      error: 'Failed to check configuration'
    });
  }
}
