import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../src/utils/database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const sourceName = formData.get('sourceName') as string || 'CSV Upload';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { success: false, error: 'File must be a CSV file' },
        { status: 400 }
      );
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();
    
    // Validate CSV content has at least headers
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'CSV file must have at least a header row and one data row' },
        { status: 400 }
      );
    }

    console.log('📊 Processing CSV upload:', {
      fileName: file.name,
      fileSize: file.size,
      userId,
      sourceName,
      linesCount: lines.length
    });

    // Create credentials object with CSV data
    const credentials = JSON.stringify({
      csvData: csvContent,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      sourceName
    });

    // Encrypt credentials before storing
    const encryptedCredentials = DatabaseService.encryptCredentials(credentials);

    // Create data source
    const dataSource = await DatabaseService.createDataSource({
      userId,
      source: 'CSV',
      isActive: true,
      credentials: encryptedCredentials,
      syncFrequency: 'manual'
    });

    console.log('✅ CSV data source created successfully:', dataSource.id);

    return NextResponse.json({ 
      success: true, 
      dataSource,
      message: 'CSV file uploaded and data source created successfully',
      metrics: {
        fileName: file.name,
        linesProcessed: lines.length - 1, // Subtract header row
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error processing CSV upload:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process CSV upload' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get all CSV data sources for the user
    const dataSources = await DatabaseService.getDataSourcesByUser(userId);
    const csvDataSources = dataSources.filter(ds => ds.source === 'CSV');

    // Decrypt and parse CSV data source info
    const csvInfo = csvDataSources.map(ds => {
      try {
        const decryptedCredentials = DatabaseService.decryptCredentials(
          ds.credentials.encryptedData,
          ds.credentials.iv
        );
        const credentials = JSON.parse(decryptedCredentials);
        
        return {
          id: ds.id,
          fileName: credentials.fileName,
          sourceName: credentials.sourceName,
          uploadedAt: credentials.uploadedAt,
          lastSyncAt: ds.lastSyncAt,
          isActive: ds.isActive,
          createdAt: ds.createdAt
        };
      } catch (error) {
        console.error('Error parsing CSV data source:', error);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ 
      success: true, 
      csvDataSources: csvInfo 
    });

  } catch (error) {
    console.error('❌ Error fetching CSV data sources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CSV data sources' },
      { status: 500 }
    );
  }
}