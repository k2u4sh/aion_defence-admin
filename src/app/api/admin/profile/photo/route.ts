import { NextRequest } from "next/server";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { connectDB } from "@/utils/db";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";

const getAdminModel = async () => (await import("@/models/adminModel")).default;

// POST /api/admin/profile/photo - upload profile photo
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "admin:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    
    await connectDB();
    const Admin = await getAdminModel();

    const formData = await request.formData();
    const file = formData.get('photo') as File;
    
    if (!file) {
      return ApiResponseHandler.error("No photo provided", 400);
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return ApiResponseHandler.error("Invalid file type. Only JPEG, PNG, and WebP files are allowed.", 400);
    }
    
    // Validate file size (2MB max for profile photos)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return ApiResponseHandler.error("File too large. Maximum size is 2MB.", 400);
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles', 'admins');
    
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
    
    // Generate the public URL
    const publicUrl = `/uploads/profiles/admins/${filename}`;
    
    // Update the admin's profile photo in the database
    const updatedAdmin = await Admin.findByIdAndUpdate(
      auth.admin._id,
      { profilePhoto: publicUrl },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedAdmin) {
      return ApiResponseHandler.error("Admin not found", 404);
    }
    
    return ApiResponseHandler.success({
      profilePhoto: publicUrl,
      admin: updatedAdmin
    }, "Profile photo uploaded successfully");
    
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    return ApiResponseHandler.error("Error uploading profile photo", 500);
  }
}

// DELETE /api/admin/profile/photo - remove profile photo
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "admin:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    
    await connectDB();
    const Admin = await getAdminModel();

    // Update the admin to remove profile photo
    const updatedAdmin = await Admin.findByIdAndUpdate(
      auth.admin._id,
      { profilePhoto: null },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedAdmin) {
      return ApiResponseHandler.error("Admin not found", 404);
    }
    
    return ApiResponseHandler.success({
      profilePhoto: null,
      admin: updatedAdmin
    }, "Profile photo removed successfully");
    
  } catch (error) {
    console.error("Error removing profile photo:", error);
    return ApiResponseHandler.error("Error removing profile photo", 500);
  }
}
