"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { 
  UploadIcon, 
  ImageIcon, 
  FileIcon, 
  TrashBinIcon, 
  EyeIcon,
  CopyIcon,
  DownloadIcon
} from "@/icons";

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video';
  url: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  tags: string[];
}

export default function MediaUploadPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'document' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for demonstration
  React.useEffect(() => {
    setFiles([
      {
        id: '1',
        name: 'hero-background.jpg',
        type: 'image',
        url: '/images/hero-background.jpg',
        size: 2048576,
        uploadedAt: '2024-01-15T10:30:00Z',
        uploadedBy: 'Admin User',
        tags: ['hero', 'background', 'landing']
      },
      {
        id: '2',
        name: 'fighter-jet.jpg',
        type: 'image',
        url: '/images/fighter-jet.jpg',
        size: 1536000,
        uploadedAt: '2024-01-14T15:45:00Z',
        uploadedBy: 'Admin User',
        tags: ['hero', 'military', 'aircraft']
      },
      {
        id: '3',
        name: 'company-brochure.pdf',
        type: 'document',
        url: '/documents/company-brochure.pdf',
        size: 5120000,
        uploadedAt: '2024-01-13T09:20:00Z',
        uploadedBy: 'Admin User',
        tags: ['brochure', 'company', 'marketing']
      }
    ]);
  }, []);

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

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setShowUploadModal(true);
    setTags([]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create new media file
      const newFile: MediaFile = {
        id: Date.now().toString(),
        name: selectedFile.name,
        type: selectedFile.type.startsWith('image/') ? 'image' : 
              selectedFile.type.startsWith('video/') ? 'video' : 'document',
        url: URL.createObjectURL(selectedFile),
        size: selectedFile.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Admin User',
        tags: tags
      };

      setFiles(prev => [newFile, ...prev]);
      setShowUploadModal(false);
      setSelectedFile(null);
      setTags([]);
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags(prev => [...prev, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const deleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const filteredFiles = files.filter(file => {
    const matchesType = filterType === 'all' || file.type === filterType;
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon width={20} height={20} className="text-blue-600" />;
      case 'video':
        return <FileIcon width={20} height={20} className="text-purple-600" />;
      default:
        return <FileIcon width={20} height={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Media Management</h1>
          <p className="text-gray-600">Upload and manage media files for your website</p>
        </div>
        <Link
          href="/admin-management/cms"
          className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
        >
          Back to CMS
        </Link>
      </div>

      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Drop files here or click to upload
        </h3>
        <p className="text-gray-500 mb-4">
          Support for images, documents, and videos up to 10MB
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Choose Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search files by name or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFiles.map((file) => (
          <div key={file.id} className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
            {/* File Preview */}
            <div className="aspect-square bg-gray-100 relative group">
              {file.type === 'image' ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {getFileIcon(file.type)}
                </div>
              )}
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button
                  onClick={() => {
                    setPreviewFile(file);
                    setShowPreviewModal(true);
                  }}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                  title="Preview"
                >
                  <EyeIcon width={16} height={16} />
                </button>
                <button
                  onClick={() => copyUrl(file.url)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                  title="Copy URL"
                >
                  <CopyIcon width={16} height={16} />
                </button>
                <button
                  onClick={() => deleteFile(file.id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Delete"
                >
                  <TrashBinIcon width={16} height={16} />
                </button>
              </div>
            </div>
            
            {/* File Info */}
            <div className="p-4">
              <h3 className="font-medium text-gray-900 truncate mb-1">{file.name}</h3>
              <div className="text-sm text-gray-500 space-y-1">
                <div>{formatFileSize(file.size)}</div>
                <div>{new Date(file.uploadedAt).toISOString().split('T')[0]}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {file.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)}>
        <div className="p-6 max-w-md">
          <h3 className="text-lg font-medium mb-4">Upload File</h3>
          
          {selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                {getFileIcon(selectedFile.type.startsWith('image/') ? 'image' : 
                            selectedFile.type.startsWith('video/') ? 'video' : 'document')}
                <div>
                  <div className="font-medium">{selectedFile.name}</div>
                  <div className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        <div className="p-6 max-w-4xl">
          <h3 className="text-lg font-medium mb-4">File Preview</h3>
          
          {previewFile && (
            <div className="space-y-4">
              {previewFile.type === 'image' ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full h-auto rounded"
                />
              ) : (
                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                  {getFileIcon(previewFile.type)}
                  <span className="ml-2 text-gray-600">{previewFile.name}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span>
                  <span className="ml-2">{previewFile.name}</span>
                </div>
                <div>
                  <span className="font-medium">Type:</span>
                  <span className="ml-2 capitalize">{previewFile.type}</span>
                </div>
                <div>
                  <span className="font-medium">Size:</span>
                  <span className="ml-2">{formatFileSize(previewFile.size)}</span>
                </div>
                <div>
                  <span className="font-medium">Uploaded:</span>
                  <span className="ml-2">{new Date(previewFile.uploadedAt).toISOString().split('T')[0]}</span>
                </div>
              </div>
              
              {previewFile.tags.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Tags:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {previewFile.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => copyUrl(previewFile.url)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center gap-2"
                >
                  <CopyIcon width={16} height={16} />
                  {copiedUrl === previewFile.url ? 'Copied!' : 'Copy URL'}
                </button>
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <DownloadIcon width={16} height={16} />
                  Download
                </a>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
