import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";

const getAdminModel = async () => (await import("@/models/adminModel")).default;

// PUT /api/admin/profile - update admin profile
export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "admin:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    
    await connectDB();
    const Admin = await getAdminModel();
    const body = await request.json();

    const { firstName, lastName, email, profilePhoto } = body || {};
    
    if (!firstName || !lastName || !email) {
      return ApiResponseHandler.error("firstName, lastName, and email are required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ApiResponseHandler.error("Invalid email format", 400);
    }

    // Check if email is already taken by another admin
    const existingAdmin = await Admin.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: auth.admin._id } 
    });
    
    if (existingAdmin) {
      return ApiResponseHandler.error("Email already exists", 409);
    }

    // Update the admin profile
    const updatedAdmin = await Admin.findByIdAndUpdate(
      auth.admin._id,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        ...(profilePhoto && { profilePhoto }),
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedAdmin) {
      return ApiResponseHandler.error("Admin not found", 404);
    }

    return ApiResponseHandler.success(updatedAdmin, "Profile updated successfully");
  } catch (err) {
    console.error("Update profile error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// GET /api/admin/profile - get admin profile
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "admin:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    
    await connectDB();
    const Admin = await getAdminModel();

    const admin = await Admin.findById(auth.admin._id).select('-password');
    
    if (!admin) {
      return ApiResponseHandler.error("Admin not found", 404);
    }

    return ApiResponseHandler.success(admin, "Profile fetched successfully");
  } catch (err) {
    console.error("Get profile error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}
