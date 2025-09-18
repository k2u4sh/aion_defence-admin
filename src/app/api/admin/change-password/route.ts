import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";
import bcrypt from "bcryptjs";

const getAdminModel = async () => (await import("@/models/adminModel")).default;

// POST /api/admin/change-password - change admin password
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "admin:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    
    await connectDB();
    const Admin = await getAdminModel();
    const body = await request.json();

    const { currentPassword, newPassword } = body || {};
    
    if (!currentPassword || !newPassword) {
      return ApiResponseHandler.error("currentPassword and newPassword are required", 400);
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return ApiResponseHandler.error("New password must be at least 8 characters long", 400);
    }

    // Get the admin with password for verification
    const admin = await Admin.findById(auth.admin._id).select('+password');
    
    if (!admin) {
      return ApiResponseHandler.error("Admin not found", 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password as string);
    if (!isCurrentPasswordValid) {
      return ApiResponseHandler.error("Current password is incorrect", 401);
    }

    // Check if new password is different from current password
    const isNewPasswordSame = await bcrypt.compare(newPassword, admin.password as string);
    if (isNewPasswordSame) {
      return ApiResponseHandler.error("New password must be different from current password", 400);
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password
    const updatedAdmin = await Admin.findByIdAndUpdate(
      auth.admin._id,
      { password: hashedNewPassword },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedAdmin) {
      return ApiResponseHandler.error("Failed to update password", 500);
    }

    return ApiResponseHandler.success(updatedAdmin, "Password changed successfully");
  } catch (err) {
    console.error("Change password error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}
