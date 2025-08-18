import { NextRequest } from "next/server";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Verify JWT Token and Admin Role
function verifyToken(request: NextRequest): JWTPayload | null {
  try {
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
    
    // Only allow admin users to upload files
    if (decoded.role !== 'admin') return null;
    
    return decoded;
  } catch {
    return null;
  }
}

// POST - Upload images for CMS
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return ApiResponseHandler.error("Unauthorized. Admin access required.", 401);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const section = formData.get('section') as string;
    const type = formData.get('type') as string; // 'image', 'icon', 'logo', etc.
    
    if (!file) {
      return ApiResponseHandler.error("No file provided", 400);
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return ApiResponseHandler.error("Invalid file type. Only JPEG, PNG, WebP, and SVG files are allowed.", 400);
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return ApiResponseHandler.error("File too large. Maximum size is 5MB.", 400);
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'cms', section || 'general');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.log('Directory already exists or error creating:', error);
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${originalName}`;
    const filepath = join(uploadDir, filename);
    
    // Write file
    await writeFile(filepath, buffer);
    
    // Return the public URL
    const publicUrl = `/uploads/cms/${section || 'general'}/${filename}`;
    
    return ApiResponseHandler.success({
      message: "File uploaded successfully",
      success: true,
      data: {
        filename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        section,
        uploadType: type,
        uploadedBy: user.userId,
        uploadedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Error uploading file:", error);
    return ApiResponseHandler.error("Error uploading file", 500);
  }
}

// GET - List uploaded files for CMS
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return ApiResponseHandler.error("Unauthorized. Admin access required.", 401);
    }

    const url = new URL(request.url);
    const section = url.searchParams.get('section');
    
    // This is a simple implementation. In production, you might want to store
    // file metadata in a database for better querying and management
    
    return ApiResponseHandler.success({
      message: "File list endpoint - implement based on your storage strategy",
      success: true,
      data: {
        section,
        note: "Consider implementing a file metadata storage system for better file management"
      }
    });
    
  } catch (error) {
    console.error("Error listing files:", error);
    return ApiResponseHandler.error("Error listing files", 500);
  }
}

