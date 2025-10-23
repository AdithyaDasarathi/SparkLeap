import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '../../../../src/lib/supabase-database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('🗑️ DELETE request received for data source:', id);
    
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.log('⚠️ No JSON body provided, using empty object');
      body = {};
    }
    
    const { userId } = body;
    console.log('🗑️ Deleting data source:', { id, userId });

    // Delete the data source
    const success = await SupabaseDatabaseService.deleteDataSource(id);
    console.log('🗑️ Delete operation result:', success);

    if (success) {
      console.log('✅ Data source deleted successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Data source deleted successfully' 
      });
    } else {
      console.log('❌ Failed to delete data source');
      return NextResponse.json(
        { success: false, error: 'Failed to delete data source' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('❌ Error deleting data source:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, updateType, newDatabaseId } = body;

    console.log('🔄 Updating data source:', { id, userId, updateType, newDatabaseId });

    if (updateType === 'databaseId') {
      // Get the existing data source
      const existingDataSource = await SupabaseDatabaseService.getDataSource(id);
      if (!existingDataSource) {
        return NextResponse.json(
          { success: false, error: 'Data source not found' },
          { status: 404 }
        );
      }

      // Decrypt the existing credentials
      const decryptedCredentials = SupabaseDatabaseService.decryptCredentials(
        existingDataSource.credentials.encryptedData,
        existingDataSource.credentials.iv
      );

      // Parse the credentials
      const credentials = JSON.parse(decryptedCredentials);
      
      // Update the database ID
      credentials.databaseId = newDatabaseId;
      
      // Re-encrypt the updated credentials
      const { encryptedData, iv } = SupabaseDatabaseService.encryptCredentials(JSON.stringify(credentials));

      // Update the data source with new credentials
      const updatedDataSource = {
        ...existingDataSource,
        credentials: {
          encryptedData,
          iv
        },
        updatedAt: new Date()
      };

      const success = await SupabaseDatabaseService.updateDataSource(id, updatedDataSource);

      if (success) {
        console.log('✅ Database ID updated successfully');
        return NextResponse.json({ 
          success: true, 
          message: 'Database ID updated successfully',
          dataSource: updatedDataSource
        });
      } else {
        console.log('❌ Failed to update database ID');
        return NextResponse.json(
          { success: false, error: 'Failed to update database ID' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid update type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Error updating data source:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 