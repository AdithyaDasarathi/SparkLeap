# Google Sheets CSV Upload Plugin

This plugin allows users to upload CSV files (exported from Google Sheets or any other source) to automatically populate their KPI dashboard with data.

## Features

- **Drag & Drop Upload**: Easy file upload with drag-and-drop interface
- **CSV Validation**: Automatic validation of file format and size
- **Smart Column Mapping**: Intelligent mapping of CSV columns to KPI metrics
- **Data Source Management**: View, sync, and delete uploaded CSV data sources
- **Real-time Sync**: Manual sync capability to update KPI data
- **Sample Data**: Downloadable sample CSV for testing

## How It Works

### 1. CSV Integration Class
The `CSVIntegration` class in `src/utils/dataSourceIntegrations.ts` handles:
- Parsing CSV data from uploaded files
- Mapping column headers to KPI metrics
- Extracting metric values for dashboard display

### 2. Upload API Endpoint
The API endpoint at `/api/datasources/csv-upload` provides:
- File upload handling with validation
- CSV content parsing and storage
- Data source creation and management
- List of existing CSV data sources

### 3. Frontend Component
The `CSVUpload` component in `src/components/CSVUpload.tsx` offers:
- Drag-and-drop file upload interface
- Real-time file validation
- Data source management UI
- Sync and delete functionality

### 4. Enhanced Google Sheets Integration
The `GoogleSheetsIntegration` class now supports:
- CSV data processing
- Future Google Sheets API integration
- Fallback to CSV upload for immediate use

## Supported KPI Metrics

The system automatically maps these column headers:

### Financial Metrics
- `MRR`, `Monthly Recurring Revenue` → MRR
- `Net Profit`, `Profit` → Net Profit  
- `Burn Rate` → Burn Rate
- `Cash on Hand`, `Cash` → Cash on Hand
- `CAC`, `Customer Acquisition Cost` → CAC
- `LTV`, `Lifetime Value`, `Customer Lifetime Value` → LTV
- `Runway` → Runway

### User Metrics  
- `User Signups`, `Signups`, `New Users` → User Signups
- `Active Users` → Active Users
- `DAU`, `Daily Active Users` → DAU
- `WAU`, `Weekly Active Users` → WAU
- `Churn Rate`, `Churn` → Churn Rate

### Marketing Metrics
- `Website Traffic`, `Traffic`, `Visitors` → Website Traffic
- `Conversion Rate` → Conversion Rate
- `Lead Conversion Rate`, `Lead Conversion` → Lead Conversion Rate

### Other Metrics
- `Tasks Completed`, `Completed Tasks` → Tasks Completed

## Usage Instructions

### Step 1: Prepare Your CSV File
1. Export your data from Google Sheets as CSV
2. Ensure column headers match the supported metric names
3. Include numeric values for each metric
4. Save the file with a `.csv` extension

### Step 2: Upload the File
1. Navigate to the "CSV Upload" tab in the application
2. Drag and drop your CSV file or click to browse
3. Enter a descriptive name for your data source
4. Click "Upload CSV" to create the data source

### Step 3: Sync Your Data
1. After upload, click "Sync" to import the data
2. View the updated metrics in your KPI dashboard
3. Re-sync anytime to refresh the data

## Example CSV Format

```csv
Date,MRR,Net Profit,User Signups,Active Users,Churn Rate
2024-01-01,12500,8200,150,1250,2.5
2024-02-01,13200,8900,165,1340,2.1
2024-03-01,14100,9400,180,1420,1.8
```

## File Specifications

- **Format**: CSV files only (`.csv` extension)
- **Size Limit**: Maximum 5MB per file
- **Content**: Must include header row and at least one data row
- **Encoding**: UTF-8 recommended

## API Endpoints

### Upload CSV File
- **POST** `/api/datasources/csv-upload`
- **Body**: FormData with `file`, `userId`, `sourceName`
- **Response**: Created data source object

### List CSV Data Sources  
- **GET** `/api/datasources/csv-upload?userId={userId}`
- **Response**: Array of CSV data source information

### Sync Data Source
- **POST** `/api/sync`
- **Body**: `{ sourceId, userId }`
- **Response**: Sync result with metrics count

### Delete Data Source
- **DELETE** `/api/datasources/{id}`
- **Body**: `{ userId }`
- **Response**: Success confirmation

## Future Enhancements

1. **Direct Google Sheets API Integration**: OAuth2 authentication for real-time data sync
2. **Scheduled Sync**: Automatic periodic data updates
3. **Column Mapping UI**: Custom mapping interface for unknown headers
4. **Data Validation**: Advanced validation rules for data quality
5. **Batch Upload**: Support for multiple CSV files
6. **Export Functionality**: Export processed data back to CSV

## Development Notes

The plugin is designed to be:
- **Extensible**: Easy to add new metric mappings
- **Secure**: Encrypted storage of CSV data
- **Performant**: Efficient parsing for large datasets
- **User-friendly**: Intuitive interface with clear feedback

For Google Sheets integration, users can export their sheets as CSV and upload them through this interface while we work on implementing direct API access.