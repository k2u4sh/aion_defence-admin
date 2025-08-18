import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";

const getAdminModel = async () => (await import("@/models/adminModel")).default;

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const Admin = await getAdminModel();
    const body = await request.json();
    const { token, newPassword } = body || {};

    if (!token || !newPassword) {
      return ApiResponseHandler.error("token and newPassword are required", 400);
    }

    const admin = await Admin.findOne({
      forgotPasswordToken: token,
      forgotPasswordTokenExpiry: { $gt: new Date() }
    }).select("+password");

    if (!admin) {
      return ApiResponseHandler.error("Invalid or expired reset token", 400);
    }

    admin.password = newPassword;
    admin.forgotPasswordToken = undefined as unknown as string;
    admin.forgotPasswordTokenExpiry = undefined as unknown as Date;
    await admin.save();

    return ApiResponseHandler.success(null, "Password reset successful");
  } catch (err) {
    console.error("Admin reset password error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}


