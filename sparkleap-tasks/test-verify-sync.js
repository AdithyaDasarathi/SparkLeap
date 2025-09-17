// Simple test script to verify sync functionality
const BASE_URL = 'http://localhost:3000';

async function testVerifySync() {
  try {
    console.log('🧪 Testing verify sync functionality...');
    
    // Step 1: Create test GoogleSheets data
    console.log('\n📝 Step 1: Creating test GoogleSheets KPIs...');
    const createResponse = await fetch(`${BASE_URL}/api/test/create-google-sheets-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: 'demo-user' })
    });
    
    const createResult = await createResponse.json();
    console.log('Create result:', createResult);
    
    if (!createResult.success) {
      console.log('❌ Failed to create test data');
      return;
    }
    
    // Step 2: Test verify sync
    console.log('\n🔍 Step 2: Testing verify sync...');
    const verifyResponse = await fetch(`${BASE_URL}/api/kpi/verify-sync?userId=demo-user&source=GoogleSheets&hours=24`);
    
    const verifyResult = await verifyResponse.json();
    console.log('Verify sync result:', JSON.stringify(verifyResult, null, 2));
    
    if (verifyResult.success) {
      console.log('✅ Verify sync test passed!');
      console.log(`📊 Found ${verifyResult.verification.totalKpisFound} total KPIs`);
      console.log(`📊 Found ${verifyResult.verification.recentKpisFromSource} recent GoogleSheets KPIs`);
      console.log(`📊 Found ${verifyResult.verification.latestSyncedMetrics.length} latest synced metrics`);
    } else {
      console.log('❌ Verify sync test failed:', verifyResult.error);
    }
    
    // Step 3: Test manual sync
    console.log('\n🔄 Step 3: Testing manual sync...');
    const dataSourcesResponse = await fetch(`${BASE_URL}/api/datasources?userId=demo-user`);
    const dataSourcesResult = await dataSourcesResponse.json();
    
    if (dataSourcesResult.dataSources && dataSourcesResult.dataSources.length > 0) {
      const googleSheetsSource = dataSourcesResult.dataSources.find(ds => ds.source === 'GoogleSheets');
      
      if (googleSheetsSource) {
        console.log(`🔄 Testing manual sync for data source: ${googleSheetsSource.id}`);
        
        const manualSyncResponse = await fetch(`${BASE_URL}/api/sync/manual`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            sourceId: googleSheetsSource.id, 
            userId: 'demo-user' 
          })
        });
        
        const manualSyncResult = await manualSyncResponse.json();
        console.log('Manual sync result:', JSON.stringify(manualSyncResult, null, 2));
        
        if (manualSyncResult.success) {
          console.log('✅ Manual sync test passed!');
        } else {
          console.log('❌ Manual sync test failed:', manualSyncResult.error);
        }
      } else {
        console.log('❌ No GoogleSheets data source found for manual sync test');
      }
    } else {
      console.log('❌ No data sources found for manual sync test');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVerifySync();





