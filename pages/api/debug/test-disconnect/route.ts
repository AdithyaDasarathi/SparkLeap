import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '../../../../src/lib/supabase-database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataSourceId, userId } = body;

    console.log('🧪 Testing disconnect functionality:', { dataSourceId, userId });

    // First, check if the data source exists
    const dataSource = await SupabaseDatabaseService.getDataSource(dataSourceId);
    console.log('📋 Data source found:', dataSource ? 'Yes' : 'No');
    
    if (dataSource) {
      console.log('📊 Data source details:', {
        id: dataSource.id,
        source: dataSource.source,
        userId: dataSource.user_id,
        isActive: dataSource.is_active
      });
    }

    // Try to delete it
    const deleteResult = await SupabaseDatabaseService.deleteDataSource(dataSourceId);
    console.log('🗑️ Delete result:', deleteResult);

    // Check if it still exists
    const dataSourceAfterDelete = await SupabaseDatabaseService.getDataSource(dataSourceId);
    console.log('📋 Data source after delete:', dataSourceAfterDelete ? 'Still exists' : 'Deleted');

    return NextResponse.json({
      success: true,
      debug: {
        dataSourceExists: !!dataSource,
        deleteResult,
        stillExists: !!dataSourceAfterDelete,
        dataSourceDetails: dataSource ? {
          id: dataSource.id,
          source: dataSource.source,
          userId: dataSource.user_id,
          isActive: dataSource.is_active
        } : null
      }
    });
    
  } catch (error) {
    console.error('❌ Disconnect test failed:', error);
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
