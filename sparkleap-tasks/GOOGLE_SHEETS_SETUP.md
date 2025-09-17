# Google Sheets Integration Setup Guide

This guide will help you set up the Google Sheets integration to automatically sync KPI data from your Google Sheets into the SparkLeap dashboard.

## 🚀 Features

- **OAuth2 Authentication**: Secure connection to Google Sheets using OAuth2
- **Real-time Data Sync**: Pull data directly from Google Sheets API
- **Intelligent Column Mapping**: Automatically maps column headers to KPI metrics
- **Flexible Data Ranges**: Specify custom ranges to read data from
- **Multiple Sheet Support**: Access different sheets within a spreadsheet

## 📋 Prerequisites

1. A Google Cloud Project
2. Google Sheets API enabled
3. OAuth2 credentials configured
4. A Google Sheet with KPI data

## 🔧 Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### Step 2: Create OAuth2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
5. Save the Client ID and Client Secret

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Add your Google OAuth2 credentials:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXTAUTH_URL=http://localhost:3000
```

### Step 4: Prepare Your Google Sheet

1. Create or open your Google Sheet with KPI data
2. Make sure the first row contains column headers
3. Use recognizable column names (see supported metrics below)
4. Share the sheet with "Anyone with the link can view"

#### Example Sheet Structure:
```
Date          | MRR   | Net Profit | User Signups | Active Users | Churn Rate
2024-01-01    | 12500 | 8200      | 150         | 1250        | 2.5
2024-02-01    | 13200 | 8900      | 165         | 1340        | 2.1
2024-03-01    | 14100 | 9400      | 180         | 1420        | 1.8
```

## 📊 Supported KPI Metrics

The system automatically maps these column headers to KPI metrics:

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

## 🔗 How to Connect

1. Navigate to the KPI Dashboard page
2. Find the "Google Sheets Integration" section
3. Enter your Google Sheets URL or ID
4. Optionally specify a data range (e.g., `A1:F100`, `Sheet1!A:D`)
5. Click "Connect Google Sheets"
6. Complete the OAuth2 authorization flow
7. Your data will be automatically synced!

## 📈 Usage

### Connecting a Sheet
1. Copy your Google Sheets URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
2. Paste it into the "Google Sheets URL or ID" field
3. The system will automatically extract the sheet ID
4. Click "Connect Google Sheets" to start the OAuth flow

### Syncing Data
- Click "Sync Data" to manually update your KPI metrics
- Data is pulled from the specified range in your sheet
- Only numeric values are imported as metrics
- The latest row with data is used for each metric

### Managing Connection
- View connection status and connected account
- Disconnect and reconnect as needed
- Change data ranges by reconnecting with new parameters

## 🔧 Data Range Examples

- `A:Z` - All columns (default)
- `A1:F100` - Specific range from A1 to F100
- `Sheet1!A:D` - Columns A to D in "Sheet1"
- `Data!B2:G50` - Range B2 to G50 in "Data" sheet

## 🛠️ API Endpoints

### OAuth Authorization
- `GET /api/auth/google?action=authorize` - Get authorization URL
- `POST /api/auth/google` - Exchange code for tokens

### Data Source Management
- `POST /api/datasources` - Create Google Sheets data source
- `POST /api/sync` - Sync data from Google Sheets
- `DELETE /api/datasources/{id}` - Remove connection

## 🔒 Security

- OAuth2 tokens are encrypted before storage
- Refresh tokens allow automatic token renewal
- No API keys or passwords stored in plain text
- Secure communication with Google APIs

## 🐛 Troubleshooting

### Common Issues:

1. **"Cannot access spreadsheet"**
   - Ensure the sheet is shared with "Anyone with the link can view"
   - Check that the spreadsheet ID is correct

2. **"Authorization failed"**
   - Verify OAuth2 credentials in environment variables
   - Check redirect URI matches Google Cloud Console settings

3. **"No data found"**
   - Ensure your sheet has data in the specified range
   - Check that column headers match supported metric names

4. **"Sync failed"**
   - Verify the Google Sheets API is enabled
   - Check that OAuth tokens haven't expired

### Debug Steps:
1. Check browser console for error messages
2. Verify environment variables are set correctly
3. Test with a simple sheet with known data
4. Ensure Google Sheets API quotas aren't exceeded

## 📚 Advanced Configuration

### Custom Column Mapping
To support additional metrics, modify the `headerMapping` object in:
`src/utils/dataSourceIntegrations.ts` → `GoogleSheetsIntegration.parseGoogleSheetsData()`

### Multiple Sheets
To read from multiple sheets in the same spreadsheet, specify ranges like:
- `Sheet1!A:Z` for the first sheet
- `Summary!B2:F20` for a summary sheet

### Automated Sync
The integration supports daily sync frequency. For more frequent updates, modify the `syncFrequency` parameter when creating the data source.

## 🎯 Next Steps

After setting up Google Sheets integration:

1. Connect your primary KPI tracking sheet
2. Set up regular sync schedule
3. Monitor data accuracy in the dashboard
4. Add additional sheets for different metric categories
5. Consider automating data entry in your Google Sheets

## 💡 Tips

- Use consistent column naming across your sheets
- Keep data in a clean tabular format
- Avoid merged cells in the data range
- Use the first row for headers only
- Include date columns for time-series analysis
- Test with a small dataset first

For additional support or feature requests, please refer to the main project documentation.