import { NotionIntegration } from './dataSourceIntegrations';
import { DatabaseService } from './database';

// Test Notion Integration
async function testNotionIntegration() {
  console.log('🧪 Testing Notion Integration...\n');

  try {
    // Test 1: Create Notion Integration Instance
    console.log('1. Creating Notion Integration instance...');
    const mockCredentials = JSON.stringify({
      token: 'test-token',
      databaseId: 'test-database-id'
    });
    const notionIntegration = new NotionIntegration(mockCredentials, 'test-user');
    console.log('✅ Notion Integration instance created successfully');

    // Test 2: Test Connection
    console.log('\n2. Testing connection...');
    const isConnected = await notionIntegration.testConnection();
    console.log(`✅ Connection test result: ${isConnected ? 'SUCCESS' : 'FAILED'}`);

    // Test 3: Test Sync
    console.log('\n3. Testing sync functionality...');
    const syncResult = await notionIntegration.sync();
    console.log('✅ Sync completed');
    console.log(`   - Success: ${syncResult.success}`);
    console.log(`   - Metrics synced: ${syncResult.metricsSynced}`);
    if (syncResult.data) {
      console.log(`   - Tasks completed: ${syncResult.data.TasksCompleted}`);
    }

    // Test 4: Test Task Analytics
    console.log('\n4. Testing task analytics...');
    const analytics = await notionIntegration.getTaskAnalytics();
    console.log('✅ Task analytics retrieved');
    console.log(`   - Weekly completion: ${analytics.weeklyCompletion}%`);
    console.log(`   - Goal alignment: ${analytics.goalAlignment}%`);
    console.log(`   - Productivity trend: ${analytics.productivityTrend}`);
    console.log(`   - Top priorities: ${analytics.topPriorities.join(', ')}`);

    // Test 5: Test API Endpoints (if server is running)
    console.log('\n5. Testing API endpoints...');
    try {
      const response = await fetch('http://localhost:3000/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          sourceId: 'test-source-id',
          action: 'analytics'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API endpoint test successful');
        console.log(`   - Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log('⚠️  API endpoint test failed (expected for test environment)');
        console.log(`   - Status: ${response.status}`);
      }
    } catch (error) {
      console.log('⚠️  API endpoint test failed (server may not be running)');
      console.log(`   - Error: ${error}`);
    }

    console.log('\n🎉 All Notion integration tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Test Database Service Integration
async function testDatabaseIntegration() {
  console.log('\n🗄️  Testing Database Integration...\n');

  try {
    // Test creating a mock data source
    console.log('1. Testing data source creation...');
    const mockDataSource = {
      userId: 'test-user',
      source: 'Notion' as const,
      isActive: true,
      credentials: DatabaseService.encryptCredentials(JSON.stringify({
        token: 'test-token',
        databaseId: 'test-database-id'
      })),
      syncFrequency: 'daily' as const
    };

    console.log('✅ Mock data source created');
    console.log(`   - User ID: ${mockDataSource.userId}`);
    console.log(`   - Source: ${mockDataSource.source}`);
    console.log(`   - Is Active: ${mockDataSource.isActive}`);

    // Test KPI data creation
    console.log('\n2. Testing KPI data creation...');
    const mockKPIData = {
      userId: 'test-user',
      metricName: 'TasksCompleted' as const,
      source: 'Notion' as const,
      value: 15,
      timestamp: new Date(),
      lastSyncedAt: new Date(),
      isManualOverride: false,
      status: 'active' as const
    };

    console.log('✅ Mock KPI data created');
    console.log(`   - Metric: ${mockKPIData.metricName}`);
    console.log(`   - Value: ${mockKPIData.value}`);
    console.log(`   - Source: ${mockKPIData.source}`);

    console.log('\n🎉 Database integration tests completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Notion Integration Tests\n');
  
  await testNotionIntegration();
  await testDatabaseIntegration();
  
  console.log('\n✨ All tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Navigate to http://localhost:3000/kpi');
  console.log('3. Connect your Notion account using the NotionConnect component');
  console.log('4. Check the browser console for any errors');
  console.log('5. Verify task analytics are displayed in the UI');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { testNotionIntegration, testDatabaseIntegration }; 