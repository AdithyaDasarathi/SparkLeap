# Verify Sync Testing Guide

This guide explains how to test and fix the verify sync functionality.

## Issues Fixed

### 1. Datasource File Issue
- **Problem**: The datasource file structure was correct, but the sync process wasn't creating KPIs with the correct source.
- **Solution**: Enhanced the KPISyncService to properly create KPIs with the correct source and added better logging.

### 2. Verify Sync Issue
- **Problem**: The verify sync API wasn't finding GoogleSheets data because no KPIs had "GoogleSheets" as the source.
- **Solution**: 
  - Added validation to check if the data source exists before verification
  - Created test endpoints to manually create GoogleSheets KPIs
  - Enhanced error handling and logging

## How to Test

### Option 1: Using the HTML Test Page

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Open the test page in your browser:
   ```
   http://localhost:3000/test-verify-sync.html
   ```

3. Click "Run All Tests" to execute all tests in sequence.

### Option 2: Using the Node.js Test Script

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Run the test script:
   ```bash
   node test-verify-sync.js
   ```

### Option 3: Manual API Testing

1. **Create Test Data**:
   ```bash
   curl -X POST http://localhost:3000/api/test/create-google-sheets-data \
     -H "Content-Type: application/json" \
     -d '{"userId": "demo-user"}'
   ```

2. **Test Verify Sync**:
   ```bash
   curl "http://localhost:3000/api/kpi/verify-sync?userId=demo-user&source=GoogleSheets&hours=24"
   ```

3. **Test Manual Sync** (if you have a GoogleSheets data source):
   ```bash
   curl -X POST http://localhost:3000/api/sync/manual \
     -H "Content-Type: application/json" \
     -d '{"sourceId": "your-source-id", "userId": "demo-user"}'
   ```

## API Endpoints Created

### 1. Create Test Data
- **Endpoint**: `POST /api/test/create-google-sheets-data`
- **Purpose**: Creates sample KPIs with "GoogleSheets" as the source for testing
- **Body**: `{"userId": "demo-user"}`

### 2. Manual Sync
- **Endpoint**: `POST /api/sync/manual`
- **Purpose**: Manually trigger a sync for a specific data source
- **Body**: `{"sourceId": "source-id", "userId": "demo-user"}`

### 3. Enhanced Verify Sync
- **Endpoint**: `GET /api/kpi/verify-sync`
- **Purpose**: Verify sync data with improved error handling
- **Query Parameters**: `userId`, `source`, `hours`

## Expected Results

After running the tests, you should see:

1. **Create Test Data**: Successfully creates 10 KPIs with "GoogleSheets" source
2. **Verify Sync**: Finds the GoogleSheets KPIs and returns verification data
3. **Manual Sync**: Either succeeds (if data source is valid) or provides clear error messages

## Troubleshooting

### If tests fail:

1. **Check if the server is running**: Make sure `npm run dev` is running on port 3000
2. **Check console logs**: Look for error messages in the terminal
3. **Verify data files**: Check that `data/kpis.json` and `data/datasources.json` exist
4. **Check network**: Ensure the API endpoints are accessible

### Common Issues:

1. **"No data source found"**: The datasource file might be empty or corrupted
2. **"Module not found"**: Make sure all dependencies are installed
3. **"Cannot find module"**: The script is trying to use CommonJS instead of ES modules

## Files Modified

- `app/api/kpi/verify-sync/route.ts` - Enhanced with better error handling
- `app/api/sync/manual/route.ts` - New manual sync endpoint
- `app/api/test/create-google-sheets-data/route.ts` - New test data creation endpoint
- `src/utils/database.ts` - Added debug logging for data loading
- `src/utils/dataSourceIntegrations.ts` - Enhanced sync logging (partial fix due to syntax errors)

## Next Steps

1. Fix the remaining syntax errors in `dataSourceIntegrations.ts`
2. Test with real GoogleSheets data sources
3. Implement proper error handling for sync failures
4. Add automated testing for the sync functionality





