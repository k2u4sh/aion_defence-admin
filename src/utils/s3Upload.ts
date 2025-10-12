import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'aiondefence';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  makePublic?: boolean;
  contentType?: string;
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  file: Buffer | Uint8Array | string,
  fileName: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const { folder = 'uploads', makePublic = true, contentType } = options;
    
    // Generate unique key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const key = `${folder}/${timestamp}-${randomString}-${fileName}`;

    // Prepare upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType || 'application/octet-stream',
      ...(makePublic && { ACL: 'public-read' as const }),
    };

    // Upload to S3
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Generate public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload multiple files to S3
 */
export async function uploadMultipleToS3(
  files: Array<{ buffer: Buffer; originalName: string; mimetype: string }>,
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => 
    uploadToS3(file.buffer, file.originalName, {
      ...options,
      contentType: file.mimetype,
    })
  );

  return Promise.all(uploadPromises);
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<UploadResult> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error('S3 Delete Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Generate a presigned URL for temporary access
 */
export async function generatePresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Presigned URL Error:', error);
    throw error;
  }
}

/**
 * Extract S3 key from URL
 */
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove leading slash and extract key
    const key = pathname.substring(1);
    return key;
  } catch (error) {
    console.error('Error extracting S3 key:', error);
    return null;
  }
}

/**
 * Get public URL for S3 object
 */
export function getS3PublicUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
}

/**
 * Validate file type
 */
export function validateFileType(fileName: string, allowedTypes: string[]): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * Get file size in MB
 */
export function getFileSizeMB(buffer: Buffer): number {
  return buffer.length / (1024 * 1024);
}

/**
 * Validate file size
 */
export function validateFileSize(buffer: Buffer, maxSizeMB: number): boolean {
  return getFileSizeMB(buffer) <= maxSizeMB;
}
