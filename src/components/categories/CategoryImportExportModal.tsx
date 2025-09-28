"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { DownloadIcon, UploadIcon, FileIcon, AlertTriangleIcon, CheckCircleIcon } from "@/icons";

interface CategoryImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

const CategoryImportExportModal: React.FC<CategoryImportExportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('updateExisting', updateExisting.toString());

      const response = await fetch('/api/admin/categories/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImportResult(result.results);
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        alert(`Import failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);

    try {
      const response = await fetch(`/api/admin/categories/export?format=${format}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `categories-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        if (data.success) {
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `categories-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          alert(`Export failed: ${data.message}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportResult(null);
    setUpdateExisting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Import / Export Categories
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'import'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Import Categories
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Export Categories
          </button>
        </div>

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Import Instructions
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Upload a CSV or JSON file with category data</li>
                      <li>Required fields: Name</li>
                      <li>Optional fields: Slug, Description, Parent Category, Level, Is Active, Sort Order, etc.</li>
                      <li>If a category with the same name or slug exists, it will be skipped unless "Update Existing" is checked</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="updateExisting"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="updateExisting" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Update existing categories if they already exist
                </label>
              </div>

              {importFile && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FileIcon className="h-4 w-4 mr-2" />
                  Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex items-center gap-2"
                >
                  <UploadIcon className="h-4 w-4" />
                  {importing ? 'Importing...' : 'Import Categories'}
                </Button>
                <Button
                  onClick={resetImport}
                  variant="outline"
                  disabled={importing}
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Import Results
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {importResult.total}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {importResult.created}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {importResult.updated}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {importResult.skipped}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Skipped</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Errors ({importResult.errors.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          Row {error.row}: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Export Options
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    Choose the format you want to export your categories in. CSV is recommended for spreadsheet applications, while JSON is better for data exchange.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <FileIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">CSV Format</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Export categories as a CSV file that can be opened in Excel, Google Sheets, or other spreadsheet applications.
                </p>
                <Button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <DownloadIcon className="h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export as CSV'}
                </Button>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <FileIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">JSON Format</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Export categories as a JSON file for data exchange or backup purposes.
                </p>
                <Button
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <DownloadIcon className="h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export as JSON'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CategoryImportExportModal;

