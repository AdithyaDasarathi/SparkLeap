// Test script to demonstrate the complete workflow
const BASE_URL = 'http://localhost:3000';

async function testCompleteWorkflow() {
  try {
    console.log('🧪 Testing complete workflow: GoogleSheets → Historical Data → KPI Graphs');
    
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
    
    // Step 2: Generate historical data
    console.log('\n📊 Step 2: Generating historical data for trends...');
    const historicalResponse = await fetch(`${BASE_URL}/api/kpi/generate-historical-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: 'demo-user', 
        days: 30, 
        source: 'GoogleSheets' 
      })
    });
    
    const historicalResult = await historicalResponse.json();
    console.log('Historical data result:', historicalResult);
    
    if (!historicalResult.success) {
      console.log('❌ Failed to generate historical data');
      return;
    }
    
    // Step 3: Test verify sync
    console.log('\n🔍 Step 3: Testing verify sync...');
    const verifyResponse = await fetch(`${BASE_URL}/api/kpi/verify-sync?userId=demo-user&source=GoogleSheets&hours=24`);
    
    const verifyResult = await verifyResponse.json();
    console.log('Verify sync result:', JSON.stringify(verifyResult, null, 2));
    
    // Step 4: Test KPI trends API
    console.log('\n📈 Step 4: Testing KPI trends API...');
    const trendsResponse = await fetch(`${BASE_URL}/api/kpi?userId=demo-user&metricName=MRR&days=30`);
    
    const trendsResult = await trendsResponse.json();
    console.log('MRR trends result:', {
      success: !!trendsResult.trends,
      dataPoints: trendsResult.trends?.length || 0,
      sampleData: trendsResult.trends?.slice(0, 3) || []
    });
    
    console.log('\n✅ Complete workflow test finished!');
    console.log('📊 Summary:');
    console.log(`   - Created ${createResult.createdCount} GoogleSheets KPIs`);
    console.log(`   - Generated ${historicalResult.totalDataPoints} historical data points`);
    console.log(`   - Found ${verifyResult.verification?.totalKpisFound || 0} total KPIs`);
    console.log(`   - MRR has ${trendsResult.trends?.length || 0} trend data points`);
    console.log('\n🎉 Now you can view the KPI Dashboard to see beautiful trend graphs!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCompleteWorkflow();







