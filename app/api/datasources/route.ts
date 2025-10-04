import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../src/utils/database';
import { DataSource, SyncFrequency } from '../../../src/types/kpi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const dataSources = await DatabaseService.getDataSourcesByUser(userId);
    const syncStatus = await DatabaseService.getSyncStatus(userId);

    return NextResponse.json({ dataSources, syncStatus });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data sources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, source, credentials, syncFrequency = 'daily' } = body;

    if (!userId || !source || !credentials) {
      return NextResponse.json(
        { error: 'userId, source, and credentials are required' },
        { status: 400 }
      );
    }

    // Encrypt credentials before storing
    const encryptedCredentials = DatabaseService.encryptCredentials(credentials);

    const dataSource = await DatabaseService.createDataSource({
      userId,
      source: source as DataSource,
      isActive: true,
      credentials: encryptedCredentials,
      syncFrequency: syncFrequency as SyncFrequency
    });

    return NextResponse.json({ dataSource }, { status: 201 });
  } catch (error) {
    console.error('Error creating data source:', error);
    return NextResponse.json(
      { error: 'Failed to create data source' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive, syncFrequency, credentials } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    
    if (isActive !== undefined) updates.isActive = isActive;
    if (syncFrequency) updates.syncFrequency = syncFrequency;
    if (credentials) {
      updates.credentials = DatabaseService.encryptCredentials(credentials);
    }

    const dataSource = await DatabaseService.updateDataSource(id, updates);
    
    if (!dataSource) {
      return NextResponse.json(
        { error: 'Data source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ dataSource });
  } catch (error) {
    console.error('Error updating data source:', error);
    return NextResponse.json(
      { error: 'Failed to update data source' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const success = await DatabaseService.deleteDataSource(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Data source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting data source:', error);
    return NextResponse.json(
      { error: 'Failed to delete data source' },
      { status: 500 }
    );
  }
} 