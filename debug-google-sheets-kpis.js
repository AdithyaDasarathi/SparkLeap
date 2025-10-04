// Debug script to check GoogleSheets KPIs
const fs = require('fs');
const path = require('path');

function debugGoogleSheetsKPIs() {
  try {
    console.log('🔍 Debugging GoogleSheets KPIs...');
    
    // Read the KPIs file
    const kpisPath = path.join(__dirname, 'data', 'kpis.json');
    const kpisData = JSON.parse(fs.readFileSync(kpisPath, 'utf8'));
    
    // Find all GoogleSheets KPIs
    const googleSheetsKPIs = Object.values(kpisData).filter(kpi => kpi.source === 'GoogleSheets');
    
    console.log(`📊 Found ${googleSheetsKPIs.length} GoogleSheets KPIs`);
    
    if (googleSheetsKPIs.length > 0) {
      // Group by metric name
      const byMetric = {};
      googleSheetsKPIs.forEach(kpi => {
        if (!byMetric[kpi.metricName]) {
          byMetric[kpi.metricName] = [];
        }
        byMetric[kpi.metricName].push({
          value: kpi.value,
          timestamp: kpi.timestamp,
          userId: kpi.userId
        });
      });
      
      console.log('\n📈 KPIs by metric:');
      Object.entries(byMetric).forEach(([metric, kpis]) => {
        console.log(`  ${metric}: ${kpis.length} data points`);
        console.log(`    Latest: ${kpis[kpis.length - 1].value} (${kpis[kpis.length - 1].timestamp})`);
        console.log(`    User ID: ${kpis[kpis.length - 1].userId}`);
      });
      
      // Check for demo-user specifically
      const demoUserKPIs = googleSheetsKPIs.filter(kpi => kpi.userId === 'demo-user');
      console.log(`\n👤 demo-user has ${demoUserKPIs.length} GoogleSheets KPIs`);
      
      if (demoUserKPIs.length > 0) {
        const demoUserByMetric = {};
        demoUserKPIs.forEach(kpi => {
          if (!demoUserByMetric[kpi.metricName]) {
            demoUserByMetric[kpi.metricName] = [];
          }
          demoUserByMetric[kpi.metricName].push(kpi);
        });
        
        console.log('\n📊 demo-user KPIs by metric:');
        Object.entries(demoUserByMetric).forEach(([metric, kpis]) => {
          console.log(`  ${metric}: ${kpis.length} data points`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging KPIs:', error);
  }
}

debugGoogleSheetsKPIs();







