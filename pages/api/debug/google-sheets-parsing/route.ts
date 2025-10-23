import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsIntegration } from '../../../../src/utils/dataSourceIntegrations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentials, spreadsheetId, range } = body;

    console.log('🧪 Testing Google Sheets parsing with credentials:', {
      hasAccessToken: !!credentials.accessToken,
      hasRefreshToken: !!credentials.refreshToken,
      spreadsheetId,
      range
    });

    // Create a test integration
    const integration = new GoogleSheetsIntegration(JSON.stringify(credentials), 'test-user');
    
    // Test the sync
    const result = await integration.sync();
    
    console.log('📊 Sync result:', result);
    
    return NextResponse.json({
      success: true,
      result,
      debug: {
        credentialsProvided: !!credentials,
        spreadsheetId,
        range,
        metricsFound: result.success ? Object.keys(result.data || {}).length : 0
      }
    });
    
  } catch (error) {
    console.error('❌ Google Sheets parsing test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
