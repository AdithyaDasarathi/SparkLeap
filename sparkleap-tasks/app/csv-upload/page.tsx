'use client';

import CSVUpload from '@/components/CSVUpload';
import Navigation from '@/components/Navigation';

export default function CSVUploadPage() {
  const handleUploadSuccess = (dataSource: any) => {
    console.log('CSV upload successful:', dataSource);
    // You could redirect to KPI dashboard or show a success message
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CSV Data Upload</h1>
          <p className="mt-2 text-lg text-gray-600">
            Upload your KPI data from CSV files and sync them with your dashboard.
          </p>
        </div>
        
        <CSVUpload onUploadSuccess={handleUploadSuccess} />
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use CSV Upload</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">1. Prepare Your CSV File</h3>
              <p className="text-gray-600">
                Create a CSV file with column headers that match your KPI metrics. 
                Common headers include: MRR, Net Profit, User Signups, Active Users, etc.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">2. Upload Your File</h3>
              <p className="text-gray-600">
                Drag and drop your CSV file or click to browse. 
                Give your data source a descriptive name.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">3. Sync Your Data</h3>
              <p className="text-gray-600">
                After uploading, click "Sync" to import the data into your KPI dashboard.
                You can re-sync anytime to update your metrics.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-900">Example CSV Format</h4>
            <pre className="mt-2 text-sm text-blue-800">
{`MRR,Net Profit,User Signups,Active Users
12500,8200,150,1250
13200,8900,165,1340
14100,9400,180,1420`}
            </pre>
            <div className="mt-3">
              <a 
                href="/sample-kpi-data.csv" 
                download 
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Sample CSV
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}