"use client";

import { useState, useEffect, useRef } from 'react';

interface CSVDataSource {
  id: string;
  fileName: string;
  sourceName: string;
  uploadedAt: string;
  lastSyncAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface CSVUploadProps {
  userId?: string;
  onUploadSuccess?: (dataSource: any) => void;
}

export default function CSVUpload({ userId = 'demo-user', onUploadSuccess }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [csvDataSources, setCsvDataSources] = useState<CSVDataSource[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing CSV data sources
  useEffect(() => {
    fetchCSVDataSources();
  }, [userId]);

  const fetchCSVDataSources = async () => {
    try {
      const res = await fetch(`/api/datasources/csv-upload?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCsvDataSources(data.csvDataSources || []);
      }
    } catch (error) {
      console.error('Error fetching CSV data sources:', error);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setMessage('Please select a CSV file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setMessage('');
    
    // Set default source name based on filename
    if (!sourceName) {
      const baseName = selectedFile.name.replace(/\.csv$/i, '');
      setSourceName(baseName);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleQuickImport = async () => {
    if (!file) {
      setMessage('Please select a CSV file');
      return;
    }

    // Use filename as source name for quick import
    const quickSourceName = file.name.replace(/\.csv$/i, '');
    setSourceName(quickSourceName);
    
    setLoading(true);
    setMessage('🔄 Quick importing CSV data...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('sourceName', quickSourceName);

      console.log('📊 Quick importing CSV file:', {
        fileName: file.name,
        size: file.size,
        sourceName: quickSourceName
      });

      const res = await fetch('/api/datasources/csv-upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const metricsSynced = data.metrics.metricsSynced || 0;
        const syncMessage = metricsSynced > 0 
          ? `✅ Quick import successful! ${metricsSynced} metrics created from ${data.metrics.linesProcessed} rows. Your KPI graphs are now updated!`
          : `✅ CSV uploaded successfully! Processed ${data.metrics.linesProcessed} rows. ${data.syncError ? 'Auto-sync failed, but you can sync manually.' : ''}`;
        
        setMessage(syncMessage);
        setFile(null);
        setSourceName('');
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Refresh the list
        fetchCSVDataSources();

        // Call success callback
        if (onUploadSuccess) {
          onUploadSuccess(data.dataSource);
        }
      } else {
        setMessage(`❌ Quick import failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Quick import error:', error);
      setMessage('❌ Quick import failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a CSV file');
      return;
    }

    if (!sourceName.trim()) {
      setMessage('Please enter a source name');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('sourceName', sourceName.trim());

      console.log('📊 Uploading CSV file:', {
        fileName: file.name,
        size: file.size,
        sourceName: sourceName.trim()
      });

      const res = await fetch('/api/datasources/csv-upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const metricsSynced = data.metrics.metricsSynced || 0;
        const syncMessage = metricsSynced > 0 
          ? `✅ CSV uploaded and synced successfully! ${metricsSynced} metrics created from ${data.metrics.linesProcessed} rows.`
          : `✅ CSV uploaded successfully! Processed ${data.metrics.linesProcessed} rows. ${data.syncError ? 'Auto-sync failed, but you can sync manually.' : ''}`;
        
        setMessage(syncMessage);
        setFile(null);
        setSourceName('');
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Refresh the list
        fetchCSVDataSources();

        // Call success callback
        if (onUploadSuccess) {
          onUploadSuccess(data.dataSource);
        }
      } else {
        setMessage(`❌ Upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('❌ Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (dataSourceId: string) => {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: dataSourceId,
          userId
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage(`✅ Sync completed! ${data.metricsSynced} metrics updated.`);
        fetchCSVDataSources(); // Refresh to show updated sync time
      } else {
        setMessage(`❌ Sync failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      setMessage('❌ Sync failed. Please try again.');
    }
  };

  const handleDelete = async (dataSourceId: string) => {
    if (!confirm('Are you sure you want to delete this CSV data source?')) {
      return;
    }

    try {
      const res = await fetch(`/api/datasources/${dataSourceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        setMessage('✅ CSV data source deleted successfully');
        fetchCSVDataSources();
      } else {
        setMessage('❌ Failed to delete CSV data source');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('❌ Failed to delete CSV data source');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">CSV Data Upload</h2>
        <p className="text-gray-600">
          Upload CSV files containing your KPI data. The system will automatically map common column headers to metrics.
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New CSV</h3>
        
        {/* Drag & Drop Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          
          <div className="mb-4">
            {file ? (
              <div className="text-sm">
                <p className="font-medium text-gray-900">Selected: {file.name}</p>
                <p className="text-gray-500">Size: {(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900">Drop your CSV file here</p>
                <p className="text-gray-500">or click to browse</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Source Name Input */}
        <div className="mt-4">
          <label htmlFor="sourceName" className="block text-sm font-medium text-gray-700 mb-2">
            Data Source Name
          </label>
          <input
            id="sourceName"
            type="text"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="e.g., Monthly Sales Data, Q4 Metrics"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Upload Buttons */}
        <div className="mt-4 flex space-x-3">
          <button
            onClick={handleQuickImport}
            disabled={!file || loading}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              !file || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
            }`}
          >
            {loading ? 'Importing...' : '🚀 Quick Import'}
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              !file || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>

        {/* Expected Format Info */}
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Expected CSV Format</h4>
          <p className="text-sm text-gray-600 mb-2">
            Your CSV should have column headers that match common KPI names:
          </p>
          <div className="text-xs text-gray-500">
            <strong>Financial:</strong> MRR, Net Profit, Burn Rate, Cash on Hand, CAC, LTV<br/>
            <strong>Users:</strong> User Signups, Active Users, DAU, WAU, Churn Rate<br/>
            <strong>Marketing:</strong> Website Traffic, Conversion Rate, Lead Conversion Rate<br/>
            <strong>Other:</strong> Tasks Completed, Runway
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Existing CSV Data Sources */}
      {csvDataSources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your CSV Data Sources</h3>
          <div className="space-y-4">
            {csvDataSources.map((dataSource) => (
              <div key={dataSource.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{dataSource.sourceName}</h4>
                    <p className="text-sm text-gray-600">File: {dataSource.fileName}</p>
                    <p className="text-sm text-gray-500">
                      Uploaded: {new Date(dataSource.uploadedAt).toLocaleDateString()}
                    </p>
                    {dataSource.lastSyncAt && (
                      <p className="text-sm text-gray-500">
                        Last synced: {new Date(dataSource.lastSyncAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSync(dataSource.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Sync
                    </button>
                    <button
                      onClick={() => handleDelete(dataSource.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}