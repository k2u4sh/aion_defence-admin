/**
 * Image utility functions for handling S3 URLs and image display
 */

/**
 * Get the full S3 URL for an image
 */
export function getImageUrl(url: string): string {
  // If it's already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a relative path, prepend the S3 bucket URL
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BUCKET_URL || 'https://aiondefence.s3.ap-south-1.amazonaws.com';
  return `${s3BaseUrl}/${url.replace(/^\//, '')}`;
}

/**
 * Get optimized image URL with size parameters
 */
export function getOptimizedImageUrl(url: string, width?: number, height?: number): string {
  const fullUrl = getImageUrl(url);
  
  // For S3 URLs, we can add query parameters for optimization
  // Note: This assumes you have CloudFront or similar CDN setup
  if (width || height) {
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    return `${fullUrl}?${params.toString()}`;
  }
  
  return fullUrl;
}

/**
 * Get thumbnail URL for an image
 */
export function getThumbnailUrl(url: string, size: number = 150): string {
  return getOptimizedImageUrl(url, size, size);
}

/**
 * Check if an image URL is valid
 */
export function isValidImageUrl(url: string): boolean {
  try {
    new URL(getImageUrl(url));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get fallback image URL
 */
export function getFallbackImageUrl(): string {
  return '/images/placeholder-product.png';
}

/**
 * Handle image load error by setting fallback
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>): void {
  const img = event.currentTarget;
  img.src = getFallbackImageUrl();
  img.alt = 'Image not available';
}

/**
 * Preload images for better performance
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = getImageUrl(url);
    });
  });
  
  return Promise.all(promises);
}

/**
 * Get image dimensions from URL
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = getImageUrl(url);
  });
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from URL
 */
export function getFileExtension(url: string): string {
  const pathname = new URL(getImageUrl(url)).pathname;
  return pathname.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is an image
 */
export function isImageFile(url: string): boolean {
  const extension = getFileExtension(url);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  return imageExtensions.includes(extension);
}

/**
 * Check if file is a video
 */
export function isVideoFile(url: string): boolean {
  const extension = getFileExtension(url);
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
  return videoExtensions.includes(extension);
}
