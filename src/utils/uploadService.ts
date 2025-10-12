/**
 * Client-side upload service for handling file uploads to S3
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  originalName?: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
  error?: string;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

export class UploadService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload files to the general upload endpoint
   */
  async uploadFiles(
    files: File[],
    folder: string = 'uploads',
    type: string = 'image',
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder', folder);
    formData.append('type', type);

    try {
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      return result.files.map((file: any) => ({
        success: true,
        url: file.url,
        key: file.key,
        originalName: file.originalName,
        size: file.size,
        type: file.type,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      options.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Upload product files (images, videos, documents)
   */
  async uploadProductFiles(
    files: File[],
    kind: 'image' | 'video' | 'document',
    productId?: string,
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('kind', kind);
    if (productId) {
      formData.append('productId', productId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/products/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      return result.data.files.map((file: any) => ({
        success: true,
        url: file.url,
        key: file.key,
        originalName: file.originalName,
        size: file.size,
        type: file.type,
        uploadedAt: file.uploadedAt,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      options.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/upload?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      return result.success;

    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }

  /**
   * Upload with progress tracking using XMLHttpRequest
   */
  async uploadWithProgress(
    files: File[],
    endpoint: string,
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          };
          options.onProgress?.(progress);
        }
      });

      // Handle successful upload
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.success) {
              const uploadResults = result.files || result.data?.files || [];
              resolve(uploadResults);
            } else {
              reject(new Error(result.message || 'Upload failed'));
            }
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      // Handle upload errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      // Start upload
      xhr.open('POST', `${this.baseUrl}${endpoint}`);
      xhr.send(formData);
    });
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, allowedTypes: string[], maxSizeMB: number): { valid: boolean; error?: string } {
    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedTypes.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `File size too large. Maximum size: ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Get file preview URL
   */
  getFilePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke file preview URL
   */
  revokeFilePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
export const uploadService = new UploadService();

// Export default instance
export default uploadService;
