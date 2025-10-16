import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3, uploadMultipleToS3, validateFileType, validateFileSize } from '@/utils/s3Upload';

// Allowed file types for products
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const ALLOWED_VIDEO_TYPES = ['mp4', 'avi', 'mov', 'webm'];
const ALLOWED_DOCUMENT_TYPES = ['pdf', 'doc', 'docx', 'txt'];

// File size limits (in MB)
const MAX_IMAGE_SIZE = 10;
const MAX_VIDEO_SIZE = 10; // Enforce 10MB video limit
const MAX_DOCUMENT_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const kind = formData.get('kind') as string || 'image';
    const productId = formData.get('productId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files provided' },
        { status: 400 }
      );
    }

    // Determine folder based on kind
    let folder = 'products';
    let allowedTypes: string[] = [];
    let maxSize = MAX_IMAGE_SIZE;

    switch (kind.toLowerCase()) {
      case 'image':
        folder = productId ? `products/${productId}/images` : 'products/images';
        allowedTypes = ALLOWED_IMAGE_TYPES;
        maxSize = MAX_IMAGE_SIZE;
        break;
      case 'video':
        folder = productId ? `products/${productId}/videos` : 'products/videos';
        allowedTypes = ALLOWED_VIDEO_TYPES;
        maxSize = MAX_VIDEO_SIZE;
        break;
      case 'document':
        folder = productId ? `products/${productId}/documents` : 'products/documents';
        allowedTypes = ALLOWED_DOCUMENT_TYPES;
        maxSize = MAX_DOCUMENT_SIZE;
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid file kind. Must be image, video, or document' },
          { status: 400 }
        );
    }

    // Validate and process files
    const processedFiles: Array<{
      buffer: Buffer;
      originalName: string;
      mimetype: string;
    }> = [];

    for (const file of files) {
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Validate file type
      if (!validateFileType(file.name, allowedTypes)) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Invalid file type for ${file.name}. Allowed types: ${allowedTypes.join(', ')}` 
          },
          { status: 400 }
        );
      }

      // Validate file size
      if (!validateFileSize(buffer, maxSize)) {
        return NextResponse.json(
          { 
            success: false, 
            message: `File ${file.name} is too large. Maximum size: ${maxSize}MB` 
          },
          { status: 400 }
        );
      }

      processedFiles.push({
        buffer,
        originalName: file.name,
        mimetype: file.type,
      });
    }

    // Upload files to S3
    const uploadResults = await uploadMultipleToS3(processedFiles, {
      folder,
      makePublic: true,
    });

    // Check for upload failures
    const failedUploads = uploadResults.filter(result => !result.success);
    if (failedUploads.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Some files failed to upload',
          errors: failedUploads.map(result => result.error)
        },
        { status: 500 }
      );
    }

    // Return successful uploads
    const uploadedFiles = uploadResults.map((result, index) => ({
      url: result.url,
      key: result.key,
      originalName: processedFiles[index].originalName,
      size: processedFiles[index].buffer.length,
      type: processedFiles[index].mimetype,
      uploadedAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length,
        kind,
        folder,
      },
    });

  } catch (error) {
    console.error('Product Upload API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { success: false, message: 'No key provided' },
        { status: 400 }
      );
    }

    const { deleteFromS3 } = await import('@/utils/s3Upload');
    const result = await deleteFromS3(key);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Product Delete API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
